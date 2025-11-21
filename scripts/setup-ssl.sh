#!/bin/bash

# SSL Setup Script with Let's Encrypt
# This script installs certbot and generates SSL certificates for your domains

set -e

echo "🔐 SSL Setup with Let's Encrypt"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script must be run as root (use sudo)"
  exit 1
fi

# Configuration
DOMAIN1="dorian-gonzalez.fr"
DOMAIN2="api.dorian-gonzalez.fr"
EMAIL="your-email@example.com"  # CHANGE THIS!
WEBROOT="/var/www/certbot"
SSL_DIR="/opt/masstock/nginx/ssl"

echo "📋 Configuration:"
echo "   Domain 1: $DOMAIN1"
echo "   Domain 2: $DOMAIN2"
echo "   Email: $EMAIL"
echo ""

# Ask for confirmation
read -p "Is the email correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Please edit this script and set the correct email address"
  exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
  echo "📦 Installing certbot..."
  apt-get update
  apt-get install -y certbot
else
  echo "✅ Certbot already installed"
fi

# Create webroot directory for ACME challenge
echo "📁 Creating webroot directory..."
mkdir -p "$WEBROOT"
mkdir -p "$SSL_DIR/$DOMAIN1"
mkdir -p "$SSL_DIR/$DOMAIN2"

# Check if nginx is running
if docker ps | grep -q masstock_nginx; then
  echo "🔄 Nginx is running in Docker, stopping temporarily..."
  NGINX_WAS_RUNNING=true
  docker-compose -f /opt/masstock/docker-compose.production.yml stop nginx
else
  NGINX_WAS_RUNNING=false
fi

# Generate certificates for domain 1
echo ""
echo "🔐 Generating certificate for $DOMAIN1..."
certbot certonly \
  --standalone \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --preferred-challenges http \
  -d "$DOMAIN1"

# Generate certificates for domain 2
echo ""
echo "🔐 Generating certificate for $DOMAIN2..."
certbot certonly \
  --standalone \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --preferred-challenges http \
  -d "$DOMAIN2"

# Copy certificates to nginx SSL directory
echo ""
echo "📋 Copying certificates to nginx SSL directory..."
cp /etc/letsencrypt/live/$DOMAIN1/fullchain.pem "$SSL_DIR/$DOMAIN1/"
cp /etc/letsencrypt/live/$DOMAIN1/privkey.pem "$SSL_DIR/$DOMAIN1/"
cp /etc/letsencrypt/live/$DOMAIN2/fullchain.pem "$SSL_DIR/$DOMAIN2/"
cp /etc/letsencrypt/live/$DOMAIN2/privkey.pem "$SSL_DIR/$DOMAIN2/"

# Set correct permissions
chmod 644 "$SSL_DIR/$DOMAIN1/fullchain.pem"
chmod 600 "$SSL_DIR/$DOMAIN1/privkey.pem"
chmod 644 "$SSL_DIR/$DOMAIN2/fullchain.pem"
chmod 600 "$SSL_DIR/$DOMAIN2/privkey.pem"

echo "✅ Certificates installed successfully!"

# Setup auto-renewal
echo ""
echo "⏰ Setting up automatic renewal..."

# Create renewal script
cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
# Renew Let's Encrypt certificates and reload nginx

certbot renew --quiet --deploy-hook "
  cp /etc/letsencrypt/live/dorian-gonzalez.fr/fullchain.pem /opt/masstock/nginx/ssl/dorian-gonzalez.fr/
  cp /etc/letsencrypt/live/dorian-gonzalez.fr/privkey.pem /opt/masstock/nginx/ssl/dorian-gonzalez.fr/
  cp /etc/letsencrypt/live/api.dorian-gonzalez.fr/fullchain.pem /opt/masstock/nginx/ssl/api.dorian-gonzalez.fr/
  cp /etc/letsencrypt/live/api.dorian-gonzalez.fr/privkey.pem /opt/masstock/nginx/ssl/api.dorian-gonzalez.fr/
  docker-compose -f /opt/masstock/docker-compose.production.yml exec nginx nginx -s reload
"
EOF

chmod +x /etc/cron.daily/certbot-renew

echo "✅ Auto-renewal configured (runs daily)"

# Restart nginx if it was running
if [ "$NGINX_WAS_RUNNING" = true ]; then
  echo ""
  echo "🔄 Restarting nginx..."
  docker-compose -f /opt/masstock/docker-compose.production.yml start nginx
fi

echo ""
echo "================================"
echo "✅ SSL Setup Complete!"
echo "================================"
echo ""
echo "Certificates installed for:"
echo "  - https://$DOMAIN1"
echo "  - https://$DOMAIN2"
echo ""
echo "Certificates will auto-renew every 60 days."
echo "Location: $SSL_DIR"
echo ""
echo "Next steps:"
echo "  1. Ensure DNS A records point to this server"
echo "  2. Start/restart docker services"
echo "  3. Test: https://$DOMAIN1"
echo ""
