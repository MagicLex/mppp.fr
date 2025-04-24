
#\!/bin/bash

# Test the email notification endpoint with different pickup times
# Usage: ./test-email.sh [pickup_time]

# Default pickup time
PICKUP_TIME=${1:-"30min"}

echo "Testing email with pickup time: $PICKUP_TIME"

# Get current date and time
DATE=$(date +"%d/%m/%Y")
TIME=$(date +"%H:%M")

# Generate a test ID
TEST_ID="test_$(date +%s)"

# Send request to the test endpoint
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$TEST_ID\",
    \"date\": \"$DATE\",
    \"time\": \"$TIME\",
    \"customer_name\": \"Client Test\",
    \"customer_email\": \"test@example.com\",
    \"customer_phone\": \"0612345678\",
    \"pickup_time\": \"$PICKUP_TIME\",
    \"notes\": \"Ceci est un test de notification. Merci de ne pas préparer cette commande.\",
    \"total\": 28.50,
    \"items\": \"1x Poulet entier; 2x Coca-Cola; 1x Pommes de terre\"
  }"

echo -e "
Test complete. Check your email inbox."

