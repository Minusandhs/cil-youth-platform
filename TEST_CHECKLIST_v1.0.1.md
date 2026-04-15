# CIL Youth Development Platform — v1.0.1 Test Checklist

**Version:** 1.0.1  
**Test Environment:** http://localhost:3000  
**Date:** _______________  
**Tested By:** _______________

---

## 1. PRE-TEST SETUP

### 1.1 Test Accounts to Create
Log in as **super_admin** and go to User Management → New User to create these accounts:

| Full Name | Email | Password | Role | LDC |
|-----------|-------|----------|------|-----|
| Super Admin | admin@test.com | *(existing)* | super_admin | — |
| National Officer | national@cil.lk | Test@1234 | national_admin | — |
| LDC Staff Colombo | ldc.colombo@cil.lk | Test@1234 | ldc_staff | LK0101 |
| LDC Staff Kandy | ldc.kandy@cil.lk | Test@1234 | ldc_staff | LK0201 |
| LDC Staff Galle | ldc.galle@cil.lk | Test@1234 | ldc_staff | LK0301 |

### 1.2 LDCs to Create (if not already present)
Go to LDC Management → New LDC:

| LDC ID | Name | Region | Church Partner |
|--------|------|--------|----------------|
| LK0101 | Colombo North LDC | Colombo | AOG |
| LK0201 | Kandy Central LDC | Kandy | House of Prayer |
| LK0301 | Galle South LDC | Galle | AOG |

### 1.3 Reference Data to Verify
Confirm these already exist (Subjects / Grades / Cert Types):

**Subjects:** English, Mathematics, Science, ICT, Commerce  
**Grades:** A, B, C, S, F  
**Cert Types:** Vocational, Professional, Academic, IT, Language, Leadership

---

## 2. TES TEST DATA

### 2.1 Create a TES Batch
Go to Admin → TES Batches → New Batch:

| Field | Value |
|-------|-------|
| Batch Name | TES 2026 — Batch 01 |
| Description | First TES batch for year 2026 |
| Application Start Date | 2026-01-01 |
| Application End Date | 2026-06-30 |
| Academic Year | 2026 |
| Status | Open |

### 2.2 TES Application — Sample Data
After participant data is loaded, log in as **LDC Staff Colombo** and submit an application for one participant:

**Personal Details (auto-filled from profile)**  
Contact Number: 0771234567  
Email: kasun@gmail.com  
NIC: 200012345678  
Guardian Name: Sunil Perera  
Marital Status: Single  
Number of Children: 0  

**Language Proficiency**  
English: Intermediate  
Sinhala: Proficient  
Tamil: Beginner  

**Institution & Course**  
Institution Name: University of Colombo  
Institution Type: State University  
Course Name: BSc Computer Science  
Registration No: CS/2024/001  
Course Duration: 4 years  
Current Year: 2  
Course Start Date: 2024-09-01  
Course End Date: 2028-06-30  

**Financial Information**  
Tuition Fee: 150,000  
Materials/Books/Exam: 25,000  
Family Contribution: 50,000  
Requested Amount: 125,000  
Financial Justification: Family income is below poverty line. Father is a daily wage labourer.  

**Community Contribution**  
Active volunteer at the local church youth group. Assists in Sunday school every week.  

**Background**  
Current Status: Undergraduate student working part-time  
Family Income (LKR/month): 35,000  
No. of Dependants: 3  
Other Assistance Received: None  
Short Term Plan: Complete degree and get an internship by 2027  
Long Term Plan: Work in the IT industry and support family  
Career Goal: Software Engineer  

**Documents Checklist** *(tick all)*  
- [x] Application Form  
- [x] Certificates (OL/AL)  
- [x] Admission Letter  
- [x] Income Proof  
- [x] NIC Copy  
- [x] Recommendation Letter  
- [x] Commitment Confirmed  

---

## 3. AUTHENTICATION TESTS

| # | Test | Steps | Expected | Pass/Fail |
|---|------|-------|----------|-----------|
| A1 | Super admin login | Login with super_admin credentials | Redirects to /admin | |
| A2 | National admin login | Login with national@cil.lk | Redirects to /admin | |
| A3 | LDC staff login | Login with ldc.colombo@cil.lk | Redirects to /ldc | |
| A4 | Wrong password | Enter wrong password | Error message shown | |
| A5 | Change password (super_admin) | Click Change Password in header | Modal opens, can change | |
| A6 | Change password (national_admin) | Click Change Password in header | Modal opens, can change | |
| A7 | Change password (ldc_staff) | Click Change Password in header | Modal opens, can change | |
| A8 | Sign out | Click Sign Out | Redirects to /login | |
| A9 | Protected route | Go to /admin without login | Redirects to /login | |

---

## 4. SUPER ADMIN — FULL ACCESS TESTS

### 4.1 Dashboard & Navigation
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| S1 | All 9 tabs visible | Overview, Participants, User Mgmt, LDC Mgmt, Participant Sync, Subjects, Grades, Cert Types, TES Batches | |
| S2 | Header subtitle | Shows "Super Admin Console" | |
| S3 | Change Password visible | Button present in header | |

### 4.2 Overview Tab
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| S4 | Stats cards load | Total participants, active, female, male counts show | |
| S5 | LDC filter works | Select an LDC, stats update | |
| S6 | Export Participants | Downloads Excel file | |
| S7 | Export TES Data | Downloads Excel file | |

### 4.3 Participants Tab
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| S8 | Participant list loads | All participants shown | |
| S9 | Search by name | Filters correctly | |
| S10 | Filter by LDC | Filters correctly | |
| S11 | Show inactive toggle | Shows/hides inactive participants | |
| S12 | View Profile button | Opens participant profile | |
| S13 | Deactivate button visible | Red Deactivate button shows in table | |
| S14 | Deactivate participant | Confirm dialog → participant deactivated | |
| S15 | Reactivate participant | Green Reactivate button → participant reactivated | |

### 4.4 User Management Tab
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| S16 | User list loads | All users shown with roles | |
| S17 | New User button visible | Can open create user form | |
| S18 | Create ldc_staff user | Form submits, user appears in list | |
| S19 | Create national_admin user | Role dropdown includes National Admin option | |
| S20 | Edit user | Can update name/email/LDC | |
| S21 | Reset Password | Can reset another user's password | |
| S22 | Deactivate user | User deactivated, shown in grey | |
| S23 | national_admin badge | Shows purple badge for national_admin role | |

### 4.5 LDC Management Tab
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| S24 | LDC list loads | All LDCs shown | |
| S25 | New LDC button visible | Can open create LDC form | |
| S26 | Edit LDC | Can update LDC details | |
| S27 | Deactivate LDC | LDC deactivated | |

### 4.6 Participant Sync Tab
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| S28 | Upload CSV | Drop zone accepts CSV file | |
| S29 | Preview shows | Stats and first 5 rows shown after upload | |
| S30 | Sync runs | Results show inserted/updated/deactivated counts | |

### 4.7 Subjects / Grades / Cert Types Tabs
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| S31 | Subjects list loads | All subjects visible | |
| S32 | Add Subject | New subject added successfully | |
| S33 | Deactivate Subject | Subject deactivated | |
| S34 | Grades list loads | All grades visible | |
| S35 | Cert Types list loads | All types visible | |
| S36 | Deactivate Cert Type | Type deactivated | |

### 4.8 TES Batches Tab (Admin View)
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| S37 | Batch list loads | TES 2026 — Batch 01 visible | |
| S38 | New Batch button | Can create a new batch | |
| S39 | Edit batch | Can update batch details | |
| S40 | Open batch | Applications tab appears | |
| S41 | View applications | All submitted applications listed | |
| S42 | View application detail | Full application form shown | |
| S43 | Admin Decision — Approve | Change status to Approved, save | |
| S44 | Admin Decision — Reject | Change status to Rejected, enter notes | |
| S45 | Export Excel | Downloads batch applications Excel | |
| S46 | Move batch to Reviewing | Status changes to Reviewing | |
| S47 | Move batch to Completed | Status changes to Completed | |

---

## 5. NATIONAL ADMIN — READ ONLY TESTS

Login as: **national@cil.lk**

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| N1 | Redirects to /admin | Yes | |
| N2 | Header subtitle | Shows "National Office — Read Only" | |
| N3 | Change Password visible | Button present in header | |
| N4 | Only 3 tabs visible | Overview, Participants, TES Batches only | |
| N5 | User Management tab absent | Not shown | |
| N6 | LDC Management tab absent | Not shown | |
| N7 | Participant Sync tab absent | Not shown | |
| N8 | Subjects tab absent | Not shown | |
| N9 | Grades tab absent | Not shown | |
| N10 | Cert Types tab absent | Not shown | |
| N11 | Participants list loads | Can see all participants | |
| N12 | **Deactivate button absent** | No Deactivate/Reactivate in participant list | |
| N13 | Can view participant profile | Click View Profile → opens profile | |
| N14 | **Deactivate button absent in profile** | No Deactivate button in profile header | |
| N15 | Profile tabs all read-only | No edit/save buttons on any tab | |
| N16 | TES Batches loads | Can see batches and applications | |
| N17 | **No New Batch button** | Cannot create batches | |
| N18 | **No status-change buttons** | Cannot move batch to Reviewing/Approved etc. | |
| N19 | Application detail — read only | Admin Decision shows as text, no Save button | |

---

## 6. LDC STAFF TESTS

Login as: **ldc.colombo@cil.lk**

### 6.1 Dashboard
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L1 | Redirects to /ldc | Yes | |
| L2 | Header shows LDC code & name | LK0101 — Colombo North LDC | |
| L3 | 3 tabs visible | Overview, Participants, TES Batches | |
| L4 | Change Password visible | Yes | |

### 6.2 LDC Overview Tab
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L5 | Stats load | Shows LDC-specific participant counts | |
| L6 | Charts load | Gender and status breakdowns show | |

### 6.3 Participants Tab (LDC view)
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L7 | Only own LDC participants shown | LK0101 participants only | |
| L8 | Search works | Filters by name | |
| L9 | View participant profile | Opens profile page | |
| L10 | No Deactivate button | LDC staff cannot deactivate | |

### 6.4 Participant Profile — Personal Info
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L11 | Personal info loads | Name, DOB, gender visible | |
| L12 | Edit personal info | Can update contact/address fields | |
| L13 | Save changes | Saved successfully, toast shown | |

### 6.5 Participant Profile — Academic Records
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L14 | OL results tab | Can add OL subject results | |
| L15 | Add OL result | Select subject + grade → saved | |
| L16 | AL results tab | Can add AL subject results | |

### 6.6 Participant Profile — Certifications
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L17 | Certifications load | Empty or existing certs shown | |
| L18 | Add certification | Fill form → saved | |
| L19 | Delete certification | Removed from list | |

### 6.7 Participant Profile — Development Plan
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L20 | Year selector works | Defaults to 2026 | |
| L21 | No plan exists | Shows "Create Plan" option | |
| L22 | Create plan | Fill goals → saved | |
| L23 | Record progress | Save progress snapshot | |
| L24 | History shows | Snapshot appears in history | |

### 6.8 Participant Profile — TES History
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L25 | TES History tab loads | Shows past TES applications | |
| L26 | After approval | Approved batch + amount shown | |

### 6.9 TES Batches Tab (LDC view)
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L27 | Open batch visible | TES 2026 — Batch 01 shown | |
| L28 | Enter batch | Applications list shown | |
| L29 | Add Application button | Visible (batch is open, deadline not passed) | |
| L30 | Submit application | Fill all fields → submitted | |
| L31 | Application in list | Shows as Pending | |
| L32 | View application | Can see full submitted form | |
| L33 | For Official Use section | LDC can fill amount + notes | |
| L34 | Remove application | Can remove pending application | |
| L35 | Rejected application | Can edit and resubmit | |
| L36 | Export Excel | Downloads batch Excel | |

### 6.10 Inactive Participant (LDC view)
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| L37 | Deactivate a participant (as admin first) | Then log back in as LDC staff | |
| L38 | Inactive participant visible | Shown with INACTIVE badge | |
| L39 | Profile is view-only | Orange banner shown, no edit buttons | |

---

## 7. MOBILE RESPONSIVENESS TESTS

Test on a screen width of 390px (iPhone) or use browser DevTools mobile view.

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| M1 | Admin dashboard header | Single row, title doesn't wrap | |
| M2 | LDC dashboard header | Single row, title doesn't wrap | |
| M3 | Admin tabs — hamburger shows | ☰ icon visible, tab bar hidden | |
| M4 | Tap ☰ | Vertical dropdown menu opens | |
| M5 | Select tab from dropdown | Navigates to tab, menu closes | |
| M6 | LDC tabs — hamburger works | Same as M3–M5 | |
| M7 | Participant profile — hamburger works | Same as M3–M5 | |
| M8 | Tables are horizontally scrollable | Can swipe left/right inside table | |
| M9 | "All LDCs" badge intact | Single line, no wrapping | |
| M10 | Export row on mobile | 2-column button grid | |

---

## 8. CROSS-ROLE ACCESS SECURITY TESTS

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| X1 | LDC staff visits /admin directly | Redirected to /ldc | |
| X2 | national_admin visits /ldc directly | Redirected to /admin | |
| X3 | LDC staff sees other LDC's participant | API returns 403/empty | |
| X4 | national_admin cannot POST via API | All write operations blocked | |

---

## 9. SIGN-OFF

| Area | Tested By | Status | Notes |
|------|-----------|--------|-------|
| Authentication | | | |
| Super Admin — Full Access | | | |
| National Admin — Read Only | | | |
| LDC Staff | | | |
| Mobile Responsiveness | | | |
| Security | | | |

**Overall Status:** ☐ Ready for v1.0.1 deployment &nbsp;&nbsp;&nbsp; ☐ Issues found — hold deployment

**Issues found:**
1. 
2. 
3. 

---

*CIL Youth Development Platform — v1.0.1 Pre-Deployment Checklist*
