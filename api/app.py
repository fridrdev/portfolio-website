"""
Proxmox Multi-Site PoC — Flask API  v3.0
Public : https://api.fridrdev.uk  (Cloudflare Zero Trust Tunnel)
Intern : http://10.132.0.4:5000   (flask-api VM, GCP europe-west1-b)
"""

import subprocess
import threading
import time
from datetime import datetime, timezone

from flask import Flask, jsonify
from flask_cors import CORS
from proxmoxer import ProxmoxAPI

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
        "host":     "10.132.0.3",
        "user":     "root@pam",
        "password": "admin",
    },
    "proxmox-bxl": {
        "host":     "10.164.0.2",
        "user":     "root@pam",
        "password": "admin",
    },
}

VM_ID              = 100
MIGRATION_COOLDOWN = 180    # 3 minuten

# ─── Global state ─────────────────────────────────────────────────────────────
last_migration_time   = 0
migration_in_progress = False
migration_lock        = threading.Lock()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_proxmox(cfg: dict) -> ProxmoxAPI:
    return ProxmoxAPI(
        cfg["host"],
        user=cfg["user"],
        password=cfg["password"],
        verify_ssl=False,
        timeout=180,
    )


def node_online(cfg: dict) -> bool:
    try:
        px = get_proxmox(cfg)
        px.nodes.get()
        return True
    except Exception:
        return False


def get_vm_location() -> tuple[str, str]:
    """
    Returns (node_name, vm_status) where node_name is
    'proxmox-ny' | 'proxmox-bxl' | 'unknown'
    and vm_status is 'stopped' | 'running' | 'unknown'.
    """
    for node_name, cfg in NODES.items():
        try:
            px  = get_proxmox(cfg)
            vm  = px.nodes(node_name).qemu(VM_ID).status.current.get()
            return node_name, vm.get("status", "unknown")
        except Exception:
            continue
    return "unknown", "unknown"


def ping_ms(host: str) -> float | None:
    """
    Ping host 2 times, return avg rtt in ms or None on failure.
    Works on Linux (GCP VM).
    """
    try:
        result = subprocess.run(
            ["ping", "-c", "2", "-W", "3", host],
            capture_output=True, text=True, timeout=10,
        )
        for line in result.stdout.splitlines():
            # Linux: rtt min/avg/max/mdev = 0.123/0.456/0.789/0.100 ms
            if "rtt" in line and "/" in line:
                parts = line.split("=")[-1].strip().split("/")
                return round(float(parts[1]), 2)
    except Exception:
        pass
    return None


def cooldown_info() -> dict:
    elapsed   = time.time() - last_migration_time
    remaining = max(0, int(MIGRATION_COOLDOWN - elapsed))
    return {
        "active":               remaining > 0,
        "retry_after_seconds":  remaining,
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "message": "API is online"})


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "name":    "Proxmox Multi-Site PoC API",
        "version": "3.0.0",
        "endpoints": [
            "GET  /ping",
            "GET  /status",
            "GET  /latency",
            "GET  /ping-nodes",
            "POST /migrate/to-bxl",
            "POST /migrate/to-ny",
        ],
    })


@app.route("/status", methods=["GET"])
def status():
    ny_cfg  = NODES["proxmox-ny"]
    bxl_cfg = NODES["proxmox-bxl"]
    ny_ok   = node_online(ny_cfg)
    bxl_ok  = node_online(bxl_cfg)
    vm_node, vm_status = get_vm_location()

    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "nodes": {
            "proxmox-ny":  {"status": "online" if ny_ok  else "offline", "ip": ny_cfg["host"]},
            "proxmox-bxl": {"status": "online" if bxl_ok else "offline", "ip": bxl_cfg["host"]},
        },
        "vm": {
            "id":           VM_ID,
            "name":         "test-vm-ny",
            "current_node": vm_node,
            "status":       vm_status,
            "note":         "VM gestopt - nested KVM niet beschikbaar op cloud nodes. Migratie werkt wel.",
        },
        "migration_in_progress": migration_in_progress,
        "migration_cooldown":    cooldown_info(),
    })


@app.route("/latency", methods=["GET"])
def latency():
    result = {}
    for node_name, cfg in NODES.items():
        ms = ping_ms(cfg["host"])
        result[node_name] = (
            {"latency_ms": ms}
            if ms is not None
            else {"latency_ms": None, "error": "unreachable"}
        )
    return jsonify(result)


@app.route("/ping-nodes", methods=["GET"])
def ping_nodes_endpoint():
    """
    Meet latentie van flask-api naar beide nodes.
    ny_to_bxl wordt berekend als som van flask→ny + flask→bxl
    (flask-api zit in dezelfde GCP regio als proxmox-ny, dus dit is een goede benadering).
    """
    ny_ms  = ping_ms(NODES["proxmox-ny"]["host"])
    bxl_ms = ping_ms(NODES["proxmox-bxl"]["host"])

    # NY → BXL: als beide bereikbaar zijn, bereken via triangulair pad
    if ny_ms is not None and bxl_ms is not None:
        ny_to_bxl_ms = round(ny_ms + bxl_ms, 2)
        ny_to_bxl_status = "ok"
    else:
        ny_to_bxl_ms = None
        ny_to_bxl_status = "timeout"

    return jsonify({
        "flask_to_ny": {
            "latency_ms": ny_ms,
            "status":     "ok" if ny_ms is not None else "timeout",
        },
        "flask_to_bxl": {
            "latency_ms": bxl_ms,
            "status":     "ok" if bxl_ms is not None else "timeout",
        },
        "ny_to_bxl": {
            "latency_ms": ny_to_bxl_ms,
            "status":     ny_to_bxl_status,
        },
    })


@app.route("/verify", methods=["GET"])
def verify():
    """
    Lijst alle VMs op elke node via .qemu.get() en controleert of VM_ID aanwezig is.
    Geeft een plat object terug: {proxmox-ny, proxmox-bxl, confirmed_node}
    """
    result = {
        "proxmox-ny":    None,
        "proxmox-bxl":   None,
        "confirmed_node": None,
    }

    # proxmox-ny
    try:
        px  = get_proxmox(NODES["proxmox-ny"])
        vms = px.nodes("proxmox-ny").qemu.get()
        found = any(int(vm["vmid"]) == VM_ID for vm in vms)
        result["proxmox-ny"] = "status: stopped" if found else "Configuration file does not exist"
        if found:
            result["confirmed_node"] = "proxmox-ny"
    except Exception as e:
        result["proxmox-ny"] = f"Error: {e}"

    # proxmox-bxl
    try:
        px  = get_proxmox(NODES["proxmox-bxl"])
        vms = px.nodes("proxmox-bxl").qemu.get()
        found = any(int(vm["vmid"]) == VM_ID for vm in vms)
        result["proxmox-bxl"] = "status: stopped" if found else "Configuration file does not exist"
        if found:
            result["confirmed_node"] = "proxmox-bxl"
    except Exception as e:
        result["proxmox-bxl"] = f"Error: {e}"

    return jsonify(result)


@app.route("/migrate/to-bxl", methods=["POST"])
def migrate_to_bxl():
    return _migrate(from_node="proxmox-ny", to_node="proxmox-bxl")


@app.route("/migrate/to-ny", methods=["POST"])
def migrate_to_ny():
    return _migrate(from_node="proxmox-bxl", to_node="proxmox-ny")


def _migrate(from_node: str, to_node: str):
    global last_migration_time, migration_in_progress

    # ── Guard: already running ────────────────────────────────────────────
    if migration_in_progress:
        return jsonify({
            "status":  "error",
            "code":    "migration_busy",
            "message": "Er is al een migratie bezig, wacht tot deze klaar is.",
        }), 429

    # ── Guard: cooldown ───────────────────────────────────────────────────
    cd = cooldown_info()
    if cd["active"]:
        return jsonify({
            "status":              "error",
            "code":                "rate_limited",
            "message":             f"Wacht nog {cd['retry_after_seconds']}s voor de volgende migratie.",
            "retry_after_seconds": cd["retry_after_seconds"],
        }), 429

    # ── Find VM ───────────────────────────────────────────────────────────
    current, vm_st = get_vm_location()

    if current == "unknown":
        return jsonify({
            "status":  "error",
            "message": f"VM {VM_ID} niet gevonden op een van de nodes.",
        }), 500

    if current == to_node:
        return jsonify({
            "status":  "error",
            "code":    "already_there",
            "message": f"VM {VM_ID} staat al op {to_node}.",
        }), 400

    if current != from_node:
        return jsonify({
            "status":  "error",
            "message": f"VM {VM_ID} staat op {current}, verwacht {from_node}.",
        }), 400

    # ── Execute migration ──────────────────────────────────────────────────
    with migration_lock:
        migration_in_progress = True

    try:
        px = get_proxmox(NODES[from_node])

        # Offline migration — geen shared storage op GCP
        px.nodes(from_node).qemu(VM_ID).migrate.post(
            target=to_node,
            online=0,
        )

        # Poll elke 3s tot VM op bestemmingsnode staat (max 120s)
        migrated = False
        for _ in range(40):          # 40 × 3s = 120s
            time.sleep(3)
            new_node, _ = get_vm_location()
            if new_node == to_node:
                migrated = True
                break

        if not migrated:
            return jsonify({
                "status":  "error",
                "code":    "migration_timeout",
                "message": "Migratie time-out: VM niet aangekomen na 120 seconden.",
            }), 500

        last_migration_time = time.time()

        return jsonify({
            "status":  "success",
            "message": f"VM {VM_ID} gemigreerd naar {to_node}",
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        with migration_lock:
            migration_in_progress = False


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
