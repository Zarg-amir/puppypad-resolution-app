# Test Order Data for PuppyPad Resolution App

This file contains test order details for testing the Customer Lookup and Deep Search functionality in the chat app and simulator.

## Standard Orders

Use these for basic order lookup testing:

| Email | First Name | Order # |
|-------|------------|---------|
| meadowhillsdr@gmail.com | Pam | #108520P |
| bap42002@yahoo.com | Barbara | #163428P |

## ParcelPanel Status Testing

Use these for testing different order statuses and tracking:

| Status | Email | Phone | Name | Order # |
|--------|-------|-------|------|---------|
| Pending (<10hr) | croberge36@hotmail.com | +1 418-563-8986 | Christine | #171164P |
| Info Received | george@georgetfreeman.com | — | George | #170462P |
| In Transit | debsnid@aol.com | — | Deborah | #169992P |
| In Transit (>8 days) | jeffk59@gmail.com | — | Jeffrey | #164959P |
| In Transit (>16 days) | Rodriguez.rubbens@gmail.com | — | Rodriguez | #156657P |
| Out For Delivery | ehsquirkle@gmail.com | — | Letitia | #166333P |
| Ready For Pickup | Jean89117@yahoo.com | +1 724-393-1428 | Jean | #162703P |
| Delivered | mkovach8@icloud.com | +1 732-673-9741 | Mary | #166461P |
| Exception | gasquelenda@gmail.com | +1 256-366-3467 | Lenda | #165032P |
| Failed Attempt | wglawe@gmail.com | — | William | #165709P |
| Expired | sorrycharlie54@yahoo.com | — | Vicki | #138526P |

## Subscription & Location Testing

Use these for testing subscription flows and international orders:

| Type | Email | Phone | Name | Order # |
|------|-------|-------|------|---------|
| Subscription | mkovach8@icloud.com | +1 732-673-9741 | Mary | #166461P |
| USA | mkovach8@icloud.com | +1 732-673-9741 | Mary | #166461P |
| International | croberge36@hotmail.com | +1 418-563-8986 | Christine | #171164P |

## Usage Notes

- **Customer Lookup**: Use email + first name + order number (optional)
- **Deep Search**: Use first name + last name + street address + country
- **Phone Lookup**: Some entries have phone numbers for phone-based lookup testing
- **Order Status**: ParcelPanel entries can be used to test different shipping status scenarios
