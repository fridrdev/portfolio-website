from flask import Flask, jsonify
from flask_cors import CORS
from proxmoxer import ProxmoxAPI
import subprocess
import platform
import datetime

app = Flask(__name__)
CORS(app)

PVE_NY  = {"host": "192.168.99.10", "user": "root@pam", "password": "admin1234", "verify_ssl": False}
PVE_BXL = {"host": "192.168.99.11", "user": "root@pam", "password": "admin1234", "verify_ssl": False}
VM_ID   = 100

def get_proxmox(cfg):
    return ProxmoxAPI(cfg["host"], user=cfg["user"], password=cfg["password"], verify_ssl=False)

def ping_host(host):
    param = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        result = subprocess.run(["ping", param, "4", host], capture_output=True, text=True, timeout=10)
        lines = result.stdout.splitlines()
        for line in lines:
            if "ms" in line.lower() and ("average" in line.lower() or "moy" in line.lower()):
                return line.strip()
        return "No response"
    except Exception as e:
        return str(e)

@app.route("/")
def index():
    return jsonify({
        "name": "Proxmox Multi-Site PoC API",
        "version": "1.0.0",
        "endpoints": [
            "/status",
            "/migrate/to-bxl",
            "/migrate/to-ny",
            "/ping",
            "/latency"
        ]
    })

@app.route("/status")
def status():
    try:
        ny  = get_proxmox(PVE_NY)
        bxl = get_proxmox(PVE_BXL)
        ny_status  = ny.nodes.get()
        bxl_status = bxl.nodes.get()
        vms_ny  = ny.nodes("pve-ny-01").qemu.get()
        vms_bxl = bxl.nodes("pve-bxl-01").qemu.get()
        return jsonify({
            "timestamp": str(datetime.datetime.now()),
            "nodes": {
                "pve-ny-01":  {"status": "online", "vms": len(vms_ny)},
                "pve-bxl-01": {"status": "online", "vms": len(vms_bxl)}
            },
            "cluster": "poc-cluster",
            "tunnel": "active"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/migrate/to-bxl")
def migrate_to_bxl():
    try:
        ny = get_proxmox(PVE_NY)
        ny.nodes("pve-ny-01").qemu(VM_ID).migrate.post(
            target="pve-bxl-01", online=1
        )
        return jsonify({
            "status": "migration_started",
            "vm": VM_ID,
            "from": "pve-ny-01",
            "to": "pve-bxl-01",
            "type": "live (online)"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/migrate/to-ny")
def migrate_to_ny():
    try:
        bxl = get_proxmox(PVE_BXL)
        bxl.nodes("pve-bxl-01").qemu(VM_ID).migrate.post(
            target="pve-ny-01", online=1
        )
        return jsonify({
            "status": "migration_started",
            "vm": VM_ID,
            "from": "pve-bxl-01",
            "to": "pve-ny-01",
            "type": "live (online)"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/ping")
def ping():
    return jsonify({
        "ny_to_bxl":  ping_host("192.168.99.11"),
        "bxl_to_ny":  ping_host("192.168.99.10"),
        "pfsense_ny":  ping_host("192.168.10.1"),
        "pfsense_bxl": ping_host("192.168.20.1")
    })

@app.route("/latency")
def latency():
    return jsonify({
        "management_network": ping_host("192.168.99.11"),
        "vpn_tunnel":         ping_host("192.168.20.1"),
        "internet":           ping_host("8.8.8.8")
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)