# Kedar Enterprise ERP — Role & Task Guide

This document lists **every module, action, and workflow step** each role can perform in the system. Use it for training, UAT, and manual testing.

**Default password for all demo accounts:** `admin123`

| Role | Email | Home page |
|------|-------|-----------|
| Owner | `admin@kedarenterprise.com` | Dashboard |
| Manager | `manager@kedarenterprise.com` | Dashboard |
| Accountant | `accountant@kedarenterprise.com` | Dashboard |
| Warehouse | `warehouse@kedarenterprise.com` | Dashboard |
| Sales | `sales@kedarenterprise.com` | Dashboard |

---

## End-to-end business flow

Typical order lifecycle across roles:

```
1. Warehouse    → Record production (adds stock)
2. Sales        → Create DRAFT sales order
3. Accountant   → Confirm order → GST invoice generated, stock deducted
4. Warehouse    → Create delivery challan → Dispatch → Mark delivered
5. Accountant   → Record customer payment
6. Manager/Owner → Review dashboard, reports, and notifications
```

**Automated API test** (runs all 6 steps): `backend/scripts/test-role-flows.ps1`

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\test-role-flows.ps1
```

---

## Permission matrix

| Module | Owner | Admin | Manager | Accountant | Warehouse | Sales |
|--------|:-----:|:-----:|:-------:|:----------:|:---------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manufacturing | ✅ R/W | ✅ R/W | ✅ R/W | ❌ | ✅ R/W | ❌ |
| Inventory | ✅ R/W | ✅ R/W | ✅ R/W | ❌ | ✅ R/W | ❌ |
| Delivery | ✅ R/W | ✅ R/W | ✅ R/W | ❌ | ✅ R/W | ❌ |
| Sales & Billing | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R/W | ❌ | ✅ R/W* |
| Customers | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R/W | ❌ | ✅ R/W |
| Payments | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R/W | ❌ | ❌ |
| Products | ✅ R/W | ✅ R/W | ✅ R/W | 👁 Read | 👁 Read | 👁 Read |
| Users & Roles | ✅ R/W | ✅ R/W | ❌ | ❌ | ❌ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:** ✅ R/W = full read & write · 👁 Read = view only · ❌ = no access

\* **Sales** can create orders but **cannot confirm** them or generate invoices (see special rules below).

---

## Special rules (all roles)

| Action | Who can do it |
|--------|----------------|
| **Confirm sales order & generate invoice** | Owner, Admin, Manager, Accountant only |
| **Download invoice PDF** | Anyone with Sales read access |
| **Create / edit / delete users** | Owner and Admin only |
| **View notification bell** | All logged-in users (role-filtered alerts) |
| **Edit customer phone number** | Not allowed after creation (read-only on edit) |
| **Credit limit check on confirm** | System blocks confirm if order exceeds available credit |

---

## 1. Owner

**Purpose:** Full business control — all operations plus user administration.

### Modules in sidebar
Dashboard · Manufacturing · Inventory · Delivery · Sales & Billing · Customers · Payments · Products · Users & Roles

### Tasks you can perform

#### Dashboard
- View full KPIs: production, sales, revenue, outstanding payments, low stock, deliveries
- See sales trend chart and best-selling products
- Review role tasks, draft orders, invoices awaiting challan
- Use Quick Actions to jump to any module
- Read Recent Activity

#### Manufacturing
- View all production batches and yield data
- **Create production entry** (product, batch no, date, quantity) — increases stock

#### Inventory
- View stock levels, thresholds, and low-stock status
- **Stock adjustment** (add or reduce quantity with notes)

#### Delivery
- View all challans and delivery status
- **Create challan** from confirmed invoice
- **Dispatch** pending challan
- **Mark delivered** for dispatched shipments

#### Sales & Billing
- View orders and invoices tabs
- **Create new sales order** (saved as DRAFT)
- **Confirm & Invoice** draft orders (generates GST invoice, deducts stock)
- **Download invoice PDF**

#### Customers
- View customer list with outstanding balances
- **Add new customer** (name, phone, city, state, credit limit)
- **Edit customer** (name, city, state, credit limit — phone is locked)

#### Payments
- View payment history
- View outstanding balances per customer
- **Record payment** (Cash, UPI, Bank Transfer, Cheque)

#### Products
- View product catalogue (price, HSN, GST, stock)
- **Add new product**
- Edit / deactivate products (via API)

#### Users & Roles
- View all users and roles
- **Add new user** with role assignment
- Update user details, activate/deactivate, reset password (via API)

#### Notifications
- View all notifications in the bell icon
- Mark individual or all notifications as read

### Cannot do
- Nothing is restricted for Owner (full access).

---

## 2. Admin

**Purpose:** Same as Owner — full system administration.

### Modules & tasks
Identical to **Owner** (all modules, all write actions, user management).

### Demo note
Seed data uses `admin@kedarenterprise.com` as the **Owner** role. An Admin role exists in the system with the same `*` permissions if you create an Admin user.

---

## 3. Manager

**Purpose:** Run day-to-day operations across production, inventory, sales, billing, payments, and delivery — without user administration.

### Modules in sidebar
Dashboard · Manufacturing · Inventory · Delivery · Sales & Billing · Customers · Payments · Products

### Tasks you can perform

#### Dashboard
- Full operational overview (same KPIs as Owner except user admin)
- My Tasks: challans, dispatch, draft orders, low stock, collections
- Quick Actions for all operational modules

#### Manufacturing
- View production history
- **Create production entry**

#### Inventory
- View stock summary and low-stock alerts
- **Stock adjustment**

#### Delivery
- View challans and available invoices
- **Create challan → Dispatch → Mark delivered**

#### Sales & Billing
- **Create sales order** (DRAFT)
- **Confirm & Invoice** draft orders
- View invoices tab and **download PDF**

#### Customers
- View, **add**, and **edit** customers

#### Payments
- View payments and outstanding
- **Record payment**

#### Products
- View catalogue
- **Add / edit products**

### Cannot do
- Access **Users & Roles** (403 Forbidden)
- Receive user-management notifications meant for Owner/Admin only

### Typical Manager workflow
1. Check dashboard for pending tasks
2. Confirm draft sales orders if Accountant is unavailable
3. Monitor low stock and coordinate production
4. Review monthly revenue and outstanding collections

---

## 4. Accountant

**Purpose:** Commercial operations — sales confirmation, invoicing, customer ledgers, and payment collection.

### Modules in sidebar
Dashboard · Sales & Billing · Customers · Payments · Products (read-only)

### Tasks you can perform

#### Dashboard
- View sales KPIs: today's sales, monthly revenue, draft orders, outstanding payments
- My Tasks: **Confirm draft orders**, outstanding collections
- Recent Activity for sales, payments, customers

#### Sales & Billing
- View all orders and invoices
- **Confirm & Invoice** on DRAFT orders (checks credit limit)
- **Download invoice PDF**
- Create sales orders (optional — usually done by Sales)

#### Customers
- View customer list and outstanding balances
- **Add customer**
- **Edit customer** (credit limit, name, city, state)

#### Payments
- View payment register
- View outstanding per customer
- **Record payment** against customer balance

#### Products
- **View only** — browse products for order entry (no add/edit)

### Cannot do
- **Manufacturing** — no access
- **Inventory** — no access
- **Delivery** — no access (Warehouse handles dispatch)
- **Users & Roles** — no access
- Create production entries or stock adjustments

### Typical Accountant workflow
1. Log in → check dashboard for **draft orders**
2. Go to **Sales & Billing** → click **Confirm & Invoice** on each DRAFT order
3. If credit limit error appears, reduce order or increase customer credit limit
4. Go to **Payments** → record customer receipts
5. Download invoice PDFs for records

### After you confirm an order
- Invoice is generated with GST numbering
- Stock is deducted automatically
- Warehouse receives notification to create delivery challan
- Sales team sees order status change to CONFIRMED

---

## 5. Warehouse

**Purpose:** Production, stock control, and physical dispatch of goods.

### Modules in sidebar
Dashboard · Manufacturing · Inventory · Delivery · Products (read-only)

### Tasks you can perform

#### Dashboard (Warehouse-specific layout)
- KPI tiles: Today's Production, Low Stock, Awaiting Challan, To Dispatch
- **Dispatch actions** panel with task cards
- Invoices ready for challan list
- Low stock alerts and recent activity
- Quick Actions: Production Entry, Stock Check, Create Challan

#### Manufacturing
- View all production batches
- **Create production entry**
  - Select product (e.g. Wheat)
  - Enter batch number, date, quantity produced
  - Stock increases automatically

#### Inventory
- View stock levels and low-stock flags
- **Stock adjustment** (corrections, damage, recounts)

#### Delivery
- View all delivery challans
- See invoices available for challan (confirmed, not yet dispatched)
- **Create challan** — select invoice, enter vehicle & driver
- **Dispatch** — mark challan as on the way
- **Mark delivered** — complete delivery

#### Products
- **View only** — check product names and units for production

### Cannot do
- **Sales & Billing** — cannot create or confirm orders
- **Customers** — no access
- **Payments** — no access
- **Users & Roles** — no access
- Confirm orders or generate invoices

### Typical Warehouse workflow
1. **Morning:** Record production entries (Manufacturing)
2. **Check inventory** for low-stock items
3. **When Accountant confirms orders:** Dashboard shows invoices awaiting challan
4. Go to **Delivery** → **New Challan** → select invoice
5. **Dispatch** when vehicle leaves
6. **Mark delivered** when goods reach customer

---

## 6. Sales

**Purpose:** Customer-facing sales — create orders and manage customer master data.

### Modules in sidebar
Dashboard · Sales & Billing · Customers · Products (read-only)

### Tasks you can perform

#### Dashboard
- View draft orders count and sales-related tasks
- See message: draft orders awaiting accountant confirmation
- Quick Actions: New Sales Order, Add Customer

#### Sales & Billing
- View orders and invoices tabs
- **Create new sales order**
  - Select customer
  - Add line items (product, qty, rate)
  - Order saved as **DRAFT**
- View **Awaiting confirmation** badge on DRAFT orders (cannot confirm yourself)
- **Download invoice PDF** for confirmed orders

#### Customers
- View customer list
- **Add new customer**
- **Edit customer** (name, city, state, credit limit)

#### Products
- **View only** — browse catalogue for order line items

### Cannot do
- **Confirm & Invoice** — button hidden; API returns 403 if attempted
- **Payments** — no access
- **Manufacturing** — no access
- **Inventory** — no access
- **Delivery** — no access
- **Users & Roles** — no access
- Add or edit products

### Typical Sales workflow
1. **Add or find customer** (Customers module)
2. **Create sales order** with products and quantities
3. Order stays **DRAFT** until Accountant/Manager confirms
4. Track order status on dashboard and Sales page
5. Download PDF once invoice is generated

---

## Module reference — actions by screen

### Dashboard (`/dashboard`)
| Action | Roles |
|--------|-------|
| View KPIs & charts | All (content filtered by role) |
| View My Tasks | All (tasks filtered by permissions) |
| Quick Actions links | Write permission per module |
| Warehouse operations layout | Warehouse only |

### Manufacturing (`/manufacturing`)
| Action | Roles |
|--------|-------|
| View production batches | Owner, Admin, Manager, Warehouse |
| New Production Entry | Owner, Admin, Manager, Warehouse |

### Inventory (`/inventory`)
| Action | Roles |
|--------|-------|
| View stock table | Owner, Admin, Manager, Warehouse |
| Stock Adjustment | Owner, Admin, Manager, Warehouse |

### Delivery (`/delivery`)
| Action | Roles |
|--------|-------|
| View challans | Owner, Admin, Manager, Warehouse |
| New Challan | Owner, Admin, Manager, Warehouse |
| Dispatch (PENDING → DISPATCHED) | Owner, Admin, Manager, Warehouse |
| Mark Delivered (DISPATCHED → DELIVERED) | Owner, Admin, Manager, Warehouse |

### Sales & Billing (`/sales`)
| Action | Roles |
|--------|-------|
| View orders & invoices | Owner, Admin, Manager, Accountant, Sales |
| New Sales Order | Owner, Admin, Manager, Accountant, Sales |
| Confirm & Invoice | Owner, Admin, Manager, Accountant |
| Download PDF | Owner, Admin, Manager, Accountant, Sales |

### Customers (`/customers`)
| Action | Roles |
|--------|-------|
| View customers | Owner, Admin, Manager, Accountant, Sales |
| Add Customer | Owner, Admin, Manager, Accountant, Sales |
| Edit Customer (pencil icon) | Owner, Admin, Manager, Accountant, Sales |

### Payments (`/payments`)
| Action | Roles |
|--------|-------|
| View payment history | Owner, Admin, Manager, Accountant |
| View outstanding balances | Owner, Admin, Manager, Accountant |
| Record Payment | Owner, Admin, Manager, Accountant |

### Products (`/products`)
| Action | Roles |
|--------|-------|
| View products | All except none — all roles with module access |
| Add Product | Owner, Admin, Manager |

### Users & Roles (`/settings/users`)
| Action | Roles |
|--------|-------|
| View users | Owner, Admin |
| Add User | Owner, Admin |

### Notifications (bell icon, all pages)
| Action | Roles |
|--------|-------|
| View notifications | All logged-in users |
| Mark read / mark all read | All logged-in users |

---

## Manual UAT checklist (by role)

### Warehouse — `warehouse@kedarenterprise.com`
- [ ] Login → lands on Warehouse dashboard
- [ ] Manufacturing → New Production Entry → save batch
- [ ] Inventory → verify stock increased
- [ ] Delivery → wait for confirmed invoice → create challan
- [ ] Delivery → Dispatch → Mark Delivered
- [ ] Confirm Sales, Customers, Payments pages are **not** in sidebar

### Sales — `sales@kedarenterprise.com`
- [ ] Login → dashboard shows sales intro
- [ ] Customers → Add Customer
- [ ] Sales → New Sales Order → save as DRAFT
- [ ] Confirm **Confirm & Invoice** button is **not** shown
- [ ] Order shows "Awaiting confirmation" badge
- [ ] Confirm Payments page is **not** in sidebar

### Accountant — `accountant@kedarenterprise.com`
- [ ] Login → dashboard shows draft orders task
- [ ] Sales → Confirm & Invoice on DRAFT order
- [ ] Download invoice PDF
- [ ] Payments → Record Payment
- [ ] Confirm Manufacturing, Inventory, Delivery are **not** in sidebar

### Manager — `manager@kedarenterprise.com`
- [ ] Login → full operational dashboard
- [ ] Can access all modules except Users & Roles
- [ ] Can confirm orders and record payments
- [ ] Users page returns 403 / not in sidebar

### Owner — `admin@kedarenterprise.com`
- [ ] Login → full dashboard
- [ ] Users & Roles → view and add users
- [ ] Notifications bell → view system alerts
- [ ] Can perform any action in any module

---

## Related files

| File | Purpose |
|------|---------|
| `backend/scripts/test-role-flows.ps1` | Automated end-to-end API test for all roles |
| `backend/scripts/seed-demo-stock.ts` | Seed demo production stock if inventory is empty |
| `backend/src/common/permissions.ts` | Source of truth for role permissions |
| `frontend/src/lib/permissions.ts` | Frontend permission checks & navigation |
| `README.md` | Project setup and tech stack |

---

*Last updated for Kedar Enterprise ERP Phase 1.*
