# PuppyPad Resolution App - SOP Requirements

This document outlines all Standard Operating Procedures (SOPs) that need to be created in Slite for the Resolution App. Each SOP will be linked in ClickUp tasks to guide team members through resolution steps.

---

## Overview

When a customer submits a case through the Resolution App, a ClickUp task is created with:
- Case details (customer info, order, items, resolution type)
- A link to the relevant SOP
- Action steps for the team member

**SOP Link Format:** `https://slite.com/api/s/[document-id]`

---

## 1. Refund Requests List

**Assigned To:** [Team Member Name]

### SOPs Needed:

| SOP Name | Trigger/Scenario | What to Include |
|----------|------------------|-----------------|
| **SOP-REF-001: Partial Refund (20%)** | Customer accepts 20% refund offer | 1. Verify order in Shopify<br>2. Calculate 20% of item value<br>3. Process refund in Shopify<br>4. Send confirmation email template<br>5. Close ticket |
| **SOP-REF-002: Partial Refund (50%)** | Customer accepts 50% refund offer | Same as above with 50% calculation |
| **SOP-REF-003: Full Refund (Keep Product)** | Customer gets full refund, keeps product | 1. Verify order<br>2. Process full refund<br>3. Note: Customer keeping product<br>4. Send confirmation<br>5. Close ticket |
| **SOP-REF-004: Full Refund (Pre-Shipment)** | Order not yet shipped | 1. Cancel fulfillment in Shopify<br>2. Process full refund<br>3. Send cancellation confirmation<br>4. Close ticket |
| **SOP-REF-005: Refund Dispute Handling** | Customer disputes refund amount | 1. Review case history<br>2. Check policy eligibility<br>3. Escalation criteria<br>4. Resolution options |

---

## 2. Return Requests List

**Assigned To:** [Team Member Name]

### SOPs Needed:

| SOP Name | Trigger/Scenario | What to Include |
|----------|------------------|-----------------|
| **SOP-RET-001: Standard Return Processing** | Customer returning unused product | 1. Verify return eligibility<br>2. Confirm return address sent to customer<br>3. Monitor for tracking number<br>4. Process refund when received<br>5. Close ticket |
| **SOP-RET-002: Return Received - Inspection** | Package arrives at warehouse | 1. Inspect item condition<br>2. Document any issues<br>3. Approve/deny refund<br>4. Process refund if approved<br>5. Update customer |
| **SOP-RET-003: Return Not Received (14+ days)** | Customer shipped but not received | 1. Check tracking status<br>2. Contact customer for tracking<br>3. Investigate with carrier<br>4. Resolution options |
| **SOP-RET-004: Damaged Return Received** | Returned item is damaged | 1. Document damage with photos<br>2. Determine if customer caused damage<br>3. Partial refund options<br>4. Communicate with customer |
| **SOP-RET-005: International Returns** | Customer outside US/Canada | 1. Explain return costs<br>2. Offer alternatives (keep product, partial refund)<br>3. Process chosen resolution |

**Return Address for SOPs:**
```
PuppyPad Returns
1007 S 12th St.
Watertown, WI 53094
USA
```

---

## 3. Shipping Issues List

**Assigned To:** [Team Member Name]

### SOPs Needed:

| SOP Name | Trigger/Scenario | What to Include |
|----------|------------------|-----------------|
| **SOP-SHP-001: Package In Transit (6+ days)** | Tracking shows in transit > 6 days | 1. Check ParcelPanel for updates<br>2. Contact carrier if needed<br>3. Send reassurance message<br>4. Set follow-up reminder |
| **SOP-SHP-002: Package In Transit (15+ days)** | Tracking shows in transit > 15 days | 1. File carrier claim<br>2. Offer reship or refund<br>3. Process chosen resolution<br>4. Document for carrier claim |
| **SOP-SHP-003: Delivered Not Received** | Tracking shows delivered, customer says not received | 1. Verify delivery address<br>2. Ask customer to check with neighbors<br>3. Wait 48 hours<br>4. File carrier claim<br>5. Reship or refund |
| **SOP-SHP-004: Address Correction Needed** | Carrier flagged address issue | 1. Contact customer for correct address<br>2. Update in carrier system<br>3. Monitor for delivery<br>4. Reship if returned |
| **SOP-SHP-005: Failed Delivery Attempts** | Multiple delivery attempts failed | 1. Contact customer about availability<br>2. Offer pickup location option<br>3. Update delivery instructions<br>4. Monitor for resolution |
| **SOP-SHP-006: Carrier Exception** | Package has exception status | 1. Identify exception type<br>2. Contact carrier for details<br>3. Communicate with customer<br>4. Resolution based on exception type |
| **SOP-SHP-007: Package Lost** | Confirmed lost by carrier | 1. Document loss confirmation<br>2. Offer reship or refund<br>3. Process resolution<br>4. File carrier claim |
| **SOP-SHP-008: Wrong Item Shipped** | Customer received wrong product | 1. Apologize and verify claim<br>2. Ship correct item immediately<br>3. Provide return label for wrong item (optional)<br>4. Follow up on delivery |
| **SOP-SHP-009: Damaged In Transit** | Package arrived damaged | 1. Request photos from customer<br>2. Assess damage<br>3. Offer replacement or refund<br>4. File carrier claim |

---

## 4. Subscription Management List

**Assigned To:** [Team Member Name]

### SOPs Needed:

| SOP Name | Trigger/Scenario | What to Include |
|----------|------------------|-----------------|
| **SOP-SUB-001: Pause Subscription** | Customer wants to pause | 1. Log into CheckoutChamp<br>2. Find subscription<br>3. Apply pause (set duration)<br>4. Confirm with customer<br>5. Set reactivation reminder |
| **SOP-SUB-002: Cancel Subscription** | Customer wants to cancel | 1. Attempt retention offer<br>2. If declined, process cancellation<br>3. Confirm remaining orders (if any)<br>4. Send cancellation confirmation |
| **SOP-SUB-003: Change Delivery Schedule** | Customer wants different frequency | 1. Log into CheckoutChamp<br>2. Update delivery frequency<br>3. Confirm next delivery date<br>4. Send confirmation |
| **SOP-SUB-004: Update Shipping Address** | Customer moved or wants different address | 1. Verify new address<br>2. Update in CheckoutChamp<br>3. Confirm change<br>4. Check pending shipments |
| **SOP-SUB-005: Skip Next Shipment** | Customer wants to skip one delivery | 1. Log into CheckoutChamp<br>2. Skip next scheduled shipment<br>3. Confirm new next delivery date<br>4. Send confirmation |
| **SOP-SUB-006: Reactivate Subscription** | Customer wants to restart | 1. Find paused/cancelled subscription<br>2. Reactivate in CheckoutChamp<br>3. Confirm billing and delivery date<br>4. Send welcome back message |
| **SOP-SUB-007: Billing Issue** | Payment failed or disputed | 1. Check payment status<br>2. Contact customer about payment method<br>3. Update billing info<br>4. Retry charge or resolve dispute |

---

## 5. Manual Help List

**Assigned To:** [Team Member Name]

### SOPs Needed:

| SOP Name | Trigger/Scenario | What to Include |
|----------|------------------|-----------------|
| **SOP-MAN-001: General Inquiry** | Question not fitting other categories | 1. Understand customer question<br>2. Research answer<br>3. Respond within SLA<br>4. Follow up if needed |
| **SOP-MAN-002: Product Question** | Customer asking about product usage | 1. Check product documentation<br>2. Provide helpful tips<br>3. Offer training resources<br>4. Connect with Claudia (vet) if needed |
| **SOP-MAN-003: Escalation Required** | Issue needs manager attention | 1. Document issue thoroughly<br>2. Tag manager in ClickUp<br>3. Provide all context<br>4. Follow up on resolution |
| **SOP-MAN-004: Complex Multi-Issue Case** | Customer has multiple issues | 1. List all issues<br>2. Prioritize by urgency<br>3. Resolve one at a time<br>4. Confirm all resolved before closing |
| **SOP-MAN-005: VIP/Influencer Handling** | High-value or influencer customer | 1. Check customer history<br>2. Apply VIP treatment<br>3. Expedite resolution<br>4. Manager notification |

---

## SOP Template

When creating each SOP in Slite, use this structure:

```markdown
# [SOP-XXX-000] Title

## Overview
Brief description of when this SOP applies.

## Prerequisites
- Access needed (Shopify, CheckoutChamp, etc.)
- Information required before starting

## Steps
1. Step one with details
2. Step two with details
3. Step three with details
...

## Email Templates
[Include any canned responses needed]

## Escalation
When to escalate and to whom.

## Common Issues
- Issue 1: Solution
- Issue 2: Solution

## Related SOPs
- Link to related SOPs
```

---

## Implementation Checklist

### Phase 1: Core SOPs (Create First)
- [ ] SOP-REF-001: Partial Refund (20%)
- [ ] SOP-REF-003: Full Refund (Keep Product)
- [ ] SOP-RET-001: Standard Return Processing
- [ ] SOP-SHP-003: Delivered Not Received
- [ ] SOP-SUB-002: Cancel Subscription

### Phase 2: Common Scenarios
- [ ] SOP-REF-002: Partial Refund (50%)
- [ ] SOP-SHP-001: Package In Transit (6+ days)
- [ ] SOP-SHP-002: Package In Transit (15+ days)
- [ ] SOP-SUB-001: Pause Subscription
- [ ] SOP-SUB-003: Change Delivery Schedule

### Phase 3: Edge Cases
- [ ] All remaining SOPs

---

## Linking SOPs in Code

Once SOPs are created in Slite, update the SOP links in:
- `src/index.js` - Backend task descriptions
- Add SOP URL to ClickUp task custom field or description

**Placeholder format currently used:**
```
SOP: [Link will be added]
```

**Final format:**
```
SOP: https://slite.com/api/s/[document-id]
```

---

## Questions to Answer Before Creating SOPs

1. **Refund approval limits** - Can team members approve refunds up to $X without manager approval?
2. **Return window** - Is it 90 days from delivery or purchase?
3. **Carrier claim process** - Who files claims? What documentation needed?
4. **CheckoutChamp access** - Who has access to subscription management?
5. **Escalation path** - Manager names/contacts for each list?

---

*Last Updated: December 2024*
