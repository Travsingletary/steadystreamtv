# 🔌 SteadyStream TV API Documentation

## Overview
Complete API documentation for the SteadyStream TV automated IPTV onboarding platform.

## Base URLs
- **Production**: `https://steadystreamtv.com/api`
- **Development**: `http://localhost:4200/api`
- **Webhook**: `https://ojueihcytxwcioqtvwez.supabase.co/functions/v1`

## Authentication
All API requests require proper authentication via Supabase JWT tokens or API keys.

## Endpoints

### Payment Endpoints
- `POST /payment/create` - Create new crypto payment
- `GET /payment/:id` - Get payment status
- `POST /webhook/nowpayments` - Payment confirmation webhook

### Subscription Endpoints
- `GET /subscription` - Get user subscription
- `POST /subscription` - Create new subscription
- `PUT /subscription/:id` - Update subscription

### User Endpoints
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/iptv-accounts` - Get IPTV credentials

## Response Formats
All endpoints return JSON responses with consistent error handling.

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user

## Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
