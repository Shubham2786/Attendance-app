# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by creating a private issue or contacting the maintainers directly.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### Response Timeline

- Initial response: Within 48 hours
- Status update: Within 7 days
- Resolution: Depends on severity and complexity

## Security Best Practices

### For Users
- Keep dependencies updated
- Use strong environment variables
- Enable HTTPS in production
- Regularly backup your database
- Monitor for suspicious activity

### For Developers
- Never commit sensitive information
- Use environment variables for secrets
- Validate all user inputs
- Implement proper authentication
- Follow secure coding practices

## Known Security Considerations

- This application is designed for educational/personal use
- No built-in authentication system (add your own for production)
- SQLite database should be secured in production
- API endpoints should be protected with authentication
- Input validation should be enhanced for production use