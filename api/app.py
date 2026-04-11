"""
Proxmox Multi-Site PoC — Flask API
Public : https://api.fridrdev.uk  (Cloudflare Zero Trust Tunnel)
Intern : http://10.132.0.4:5000   (flask-api VM, GCP europe-west1-b)
"""

from flask import Flask, jsonify
from flask_cors import CORS
from proxmoxer import ProxmoxAPI
import subprocess
import platform
import time

app = Flask(__name__)

CORS(app, origins=[
    "https://fridrdev.uk",
    "https://www.fridrdev.uk",
    "http://localhost:5173",
    "http://localhost:4173",
])

# ─── Proxmox node config ───────────────────────────────────────────────────────
NODES = {
    "proxmox-ny": {
        "host":     "10.132.0.3",   # GCP europe-west1-b
        "user":     "root@pam",
        "password": "admin",
    },
    "proxmox-bxl": {
        "host":     "10.164.0.2",   # GCP europe-west4-a
        "user":     "root@pam",
        "password": "admin",
    },
}

VM_ID = 100

# ─── Rate limiting state ───────────────────────────────────────────────────────
MIGRATION_COOLDOWN = 60          # seconds between migrations
last_migration_time = 0          # epoch of last completed migration
migration_in_progress = False    # True while a migration is running


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_proxmox(node_name: str) -> ProxmoxAPI:
    cfg = NODES[node_name]
    return ProxmoxAPI(
        cfg["host"],
        user=cfg["user"],
        password=cfg["password"],
        verify_ssl=False,
        timeout=5,
    )


def ping_ms(host: str) -> int | None:
    """Return average round-trip time in ms, or None on failure."""
    flag = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        result = subprocess.run(
            ["ping", flag, "3", "-W", "2", host],
            capture_output=True, text=True, timeout=10,
        )
        for line in result.stdout.splitlines():
            line_l = line.lower()
            # Linux: "rtt min/avg/max/mdev = 1.2/2.3/3.4/..."
            if "avg" in line_l and "/" in line and "=" in line:
                parts = line.split("=")[-1].strip().split("/")
                return round(float(parts[1]))
    except Exception:
        pass
    return None


def node_status(node_name: str) -> dict:
    cfg = NODES[node_name]
    try:
        pve = get_proxmox(node_name)
        pve.nodes.get()   # lightweight reachability check
        return {"status": "online", "ip": cfg["host"]}
    except Exception:
        return {"status": "offline", "ip": cfg["host"]}


def find_vm() -> tuple[str | None, str | None]:
    """Find which node has VM_ID. Returns (node_name, vm_status)."""
    for node_name in NODES:
        try:
            pve = get_proxmox(node_name)
            vm  = pve.nodes(node_name).qemu(VM_ID).status.current.get()
            return node_name, vm.get("status", "unknown")
        except Exception:
            continue
    return None, None


def cooldown_info() -> dict:
    elapsed = time.time() - last_migration_time
    remaining = max(0, MIGRATION_COOLDOWN - int(elapsed))
    return {
        "active": remaining > 0,
        "retry_after_seconds": remaining,
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "message": "API is online"})


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "name":      "Proxmox Multi-Site PoC API",
        "version":   "2.0.0",
        "endpoints": ["/ping", "/status", "/latency", "/migrate/to-bxl", "/migrate/to-ny"],
    })


@app.route("/status", methods=["GET"])
def status():
    ny_info  = node_status("proxmox-ny")
    bxl_info = node_status("proxmox-bxl")
    vm_node, vm_st = find_vm()

    return jsonify({
        "nodes": {
            "proxmox-ny":  ny_info,
            "proxmox-bxl": bxl_info,
        },
        "vm": {
            "id":           VM_ID,
            "current_node": vm_node,
            "status":       vm_st or "unknown",
        },
        "migration_in_progress": migration_in_progress,
        "migration_cooldown":    cooldown_info(),
    })


@app.route("/latency", methods=["GET"])
def latency():
    result = {}
    for node_name, cfg in NODES.items():
        ms = ping_ms(cfg["host"])
        if ms is not None:
            result[node_name] = {"latency_ms": ms}
        else:
            result[node_name] = {"latency_ms": None, "error": "unreachable"}
    return jsonify(result)


@app.route("/migrate/to-bxl", methods=["POST"])
def migrate_to_bxl():
    return _migrate(from_node="proxmox-ny", to_node="proxmox-bxl")


@app.route("/migrate/to-ny", methods=["POST"])
def migrate_to_ny():
    return _migrate(from_node="proxmox-bxl", to_node="proxmox-ny")


def _migrate(from_node: str, to_node: str):
    """Offline migration: stop → migrate → start."""
    global last_migration_time, migration_in_progress

    # ── Rate limiting checks ──────────────────────────────────────────────────
    if migration_in_progress:
        return jsonify({
            "status":  "error",
            "code":    "migration_busy",
            "message": "Er is al een migratie bezig, wacht tot deze klaar is.",
        }), 429

    cd = cooldown_info()
    if cd["active"]:
        return jsonify({
            "status":              "error",
            "code":                "rate_limited",
            "message":             f"Wacht nog {cd['retry_after_seconds']} seconden voor de volgende migratie.",
            "retry_after_seconds": cd["retry_after_seconds"],
        }), 429

    try:
        current, vm_st = find_vm()

        if current is None:
            return jsonify({
                "status":  "error",
                "message": f"VM {VM_ID} niet gevonden op een van de nodes",
            }), 500

        if current == to_node:
            return jsonify({
                "status":  "error",
                "code":    "already_there",
                "message": f"VM {VM_ID} staat al op {to_node}",
            }), 400

        if current != from_node:
            return jsonify({
                "status":  "error",
                "message": f"VM {VM_ID} staat op {current}, niet op {from_node}",
            }), 400

        migration_in_progress = True
        pve = get_proxmox(from_node)

        # 1. Stop VM if running (required for offline migration — no shared storage)
        if vm_st == "running":
            pve.nodes(from_node).qemu(VM_ID).status.stop.post()
            for _ in range(60):
                time.sleep(1)
                st = pve.nodes(from_node).qemu(VM_ID).status.current.get()
                if st.get("status") == "stopped":
                    break

        # 2. Migrate
        pve.nodes(from_node).qemu(VM_ID).migrate.post(
            target=to_node,
            online=0,       # offline migration (geen shared storage)
        )

        # 3. Wait for VM to appear on destination node (max 120s)
        for _ in range(120):
            time.sleep(1)
            new_node, _ = find_vm()
            if new_node == to_node:
                break
        else:
            migration_in_progress = False
            return jsonify({"status": "error", "message": "Migratie time-out"}), 500

        # 4. Start VM on destination
        pve_dest = get_proxmox(to_node)
        pve_dest.nodes(to_node).qemu(VM_ID).status.start.post()

        last_migration_time = time.time()
        migration_in_progress = False

        return jsonify({
            "status":  "success",
            "message": f"VM {VM_ID} gemigreerd naar {to_node}",
        })

    except Exception as e:
        migration_in_progress = False
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
