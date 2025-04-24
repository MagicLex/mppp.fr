#\!/bin/bash

# Test script to send emails directly using node
# Usage: ./direct-test-email.sh [pickup_time]

PICKUP_TIME=${1:-"30min"}

echo "Running test email for pickup time: $PICKUP_TIME"
node test-email-direct.js $PICKUP_TIME

echo "Script completed."

