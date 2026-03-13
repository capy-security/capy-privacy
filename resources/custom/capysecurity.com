capysecurity.com {
	tls /etc/ssl/custom/fullchain.pem /etc/ssl/custom/privkey.pem
	# located here on host: /etc/letsencrypt/live/capysecurity.com/

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		X-XSS-Protection "1; mode=block"
		Referrer-Policy "strict-origin-when-cross-origin"
		Permissions-Policy "geolocation=(), microphone=(), camera=()"
	}

	root * /var/capy/custom/

	# Static assets with cache (30d)
	@static path_regexp .*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif|json)$
	handle @static {
		header Cache-Control "public, max-age=2592000"
		file_server
	}

	handle {
		file_server
	}

}