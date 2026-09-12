#!/usr/bin/env bash
set -e

echo "==> Configuring Host Network for Waydroid..."
sysctl -w net.ipv4.ip_forward=1 >/dev/null
iptables -I INPUT -i waydroid0 -j ACCEPT 2>/dev/null || true
iptables -I FORWARD -i waydroid0 -j ACCEPT 2>/dev/null || true
iptables -I FORWARD -o waydroid0 -j ACCEPT 2>/dev/null || true

echo "==> Configuring Waydroid Container Network..."
waydroid shell ip link set dev eth0 up
waydroid shell ip addr flush dev eth0
waydroid shell ip addr add 192.168.240.2/24 dev eth0
waydroid shell ip route add default via 192.168.240.1 dev eth0 2>/dev/null || true

echo "==> Restarting ADB Daemon inside Waydroid..."
waydroid shell setprop service.adb.tcp.port 5555
waydroid shell setprop ctl.restart adbd

echo "==> Connecting ADB from host..."
sleep 1
# Run adb as the real user invoking sudo if possible, otherwise normal adb
if [ -n "$SUDO_USER" ]; then
    su - "$SUDO_USER" -c "adb connect 192.168.240.2:5555 && adb devices"
else
    adb connect 192.168.240.2:5555
    adb devices
fi
