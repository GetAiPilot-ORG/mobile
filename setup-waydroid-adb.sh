#!/usr/bin/env bash
set -e

echo "==> Restarting Waydroid container (re-runs waydroid-net.sh)..."
systemctl restart waydroid-container
sleep 2

echo "==> Ensuring IPv4 forwarding..."
sysctl -w net.ipv4.ip_forward=1 >/dev/null

echo "==> Re-adding NAT + forwarding rules for waydroid0..."
iptables -t nat -C POSTROUTING -s 192.168.240.0/24 -j MASQUERADE 2>/dev/null || \
    iptables -t nat -A POSTROUTING -s 192.168.240.0/24 -j MASQUERADE
iptables -C FORWARD -i waydroid0 -j ACCEPT 2>/dev/null || \
    iptables -I FORWARD -i waydroid0 -j ACCEPT
iptables -C FORWARD -o waydroid0 -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || \
    iptables -I FORWARD -o waydroid0 -m state --state RELATED,ESTABLISHED -j ACCEPT

echo "==> Restarting ADB daemon inside Waydroid..."
waydroid shell setprop service.adb.tcp.port 5555
waydroid shell setprop ctl.restart adbd

echo "==> Connecting ADB from host..."
sleep 2

if [ -n "$SUDO_USER" ]; then
    IP=$(waydroid shell ip -4 addr show eth0 2>/dev/null | grep -oP 'inet \K[0-9.]+' || true)
    IP=${IP:-192.168.240.112}
    echo "==> Trying ADB at ${IP}:5555..."
    su - "$SUDO_USER" -c "adb connect ${IP}:5555 && adb devices"
else
    adb connect 192.168.240.112:5555
    adb devices
fi