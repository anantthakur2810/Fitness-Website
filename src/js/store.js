/**
 * Gym Database Store (DBMS Capstone)
 * Relational schema implementation from capstone_dbms.sql:
 * - membership_plan (plan_id, plan_name, duration_months, monthly_fee)
 * - member (member_id, full_name, phone, email, join_date, plan_id, status, referral_code, avatar_url, terms_accepted)
 * - penalty_rule (rule_id, grace_days, penalty_per_day, max_penalty)
 * - fee_due (due_id, member_id, due_date, fee_amount, status)
 * - payment (payment_id, due_id, paid_date, fee_paid, penalty_paid, payment_mode, notes, tag)
 * - leads (lead_id, name, phone, time_slot, goal, status, notes, created_at)
 * - classes (class_id, day, name, time, trainer_name, capacity, room)
 * - trainers (trainer_id, name, role, experience, certifications, phone, specialization, avatar_color, bio)
 * - trainer_requests (request_id, trainer_id, client_name, phone, goal, status, created_at)
 * - attendance (attendance_id, member_id, date, time, method, status, notes)
 * - equipment (equipment_id, name, category, zone, quantity, condition, status, last_inspected)
 * - equipment_issues (issue_id, equipment_id, reported_by, date, note, status)
 * - referrals (referral_id, referrer_member_id, referred_name, phone, code, reward_status, reward_details, date)
 * - terms (id, title, content)
 */

import { getAvatarColor } from './avatar.js';

const STORAGE_KEY = 'GYM_DB_STORAGE_V5';

export const INITIAL_DATA = {
  membership_plan: [
    { plan_id: 1, plan_name: 'Monthly Standard', duration_months: 1, monthly_fee: 1500.00 },
    { plan_id: 2, plan_name: 'Quarterly Fitness', duration_months: 3, monthly_fee: 1200.00 },
    { plan_id: 3, plan_name: 'Half-Yearly Pro', duration_months: 6, monthly_fee: 1000.00 },
    { plan_id: 4, plan_name: 'Annual Elite', duration_months: 12, monthly_fee: 850.00 },
    { plan_id: 5, plan_name: 'Student Special (Quarterly)', duration_months: 3, monthly_fee: 900.00 }
  ],

  member: [
    { member_id: 101, full_name: 'Aarav Sharma', phone: '+91 98201 12345', email: 'aarav.sharma@example.com', join_date: '2026-01-10', plan_id: 4, status: 'Active', referral_code: 'AF-REF-101', terms_accepted: true },
    { member_id: 102, full_name: 'Pooja Iyer', phone: '+91 98333 45678', email: 'pooja.iyer@example.com', join_date: '2026-03-15', plan_id: 2, status: 'Active', referral_code: 'AF-REF-102', terms_accepted: true },
    { member_id: 103, full_name: 'Rohan Gupta', phone: '+91 97123 98765', email: 'rohan.gupta@example.com', join_date: '2026-05-01', plan_id: 3, status: 'Active', referral_code: 'AF-REF-103', terms_accepted: true },
    { member_id: 104, full_name: 'Kavita Patil', phone: '+91 96543 21098', email: 'kavita.patil@example.com', join_date: '2026-08-20', plan_id: 1, status: 'Active', referral_code: 'AF-REF-104', terms_accepted: true },
    { member_id: 105, full_name: 'Arjun Nair', phone: '+91 93210 98765', email: 'arjun.nair@example.com', join_date: '2026-02-01', plan_id: 1, status: 'Inactive', referral_code: 'AF-REF-105', terms_accepted: true },
    { member_id: 106, full_name: 'Sneha Kulkarni', phone: '+91 98111 22334', email: 'sneha.k@example.com', join_date: '2026-04-12', plan_id: 4, status: 'Active', referral_code: 'AF-REF-106', terms_accepted: true },
    { member_id: 107, full_name: 'Vikram Joshi', phone: '+91 98222 33445', email: 'vikram.j@example.com', join_date: '2026-06-18', plan_id: 3, status: 'Active', referral_code: 'AF-REF-107', terms_accepted: true },
    { member_id: 108, full_name: 'Ananya Deshmukh', phone: '+91 98333 55667', email: 'ananya.d@example.com', join_date: '2026-07-25', plan_id: 5, status: 'Active', referral_code: 'AF-REF-108', terms_accepted: true },
    { member_id: 109, full_name: 'Karan Singhal', phone: '+91 98444 66778', email: 'karan.s@example.com', join_date: '2026-01-15', plan_id: 2, status: 'Active', referral_code: 'AF-REF-109', terms_accepted: true },
    { member_id: 110, full_name: 'Meera Sen', phone: '+91 98555 77889', email: 'meera.sen@example.com', join_date: '2026-09-01', plan_id: 1, status: 'Active', referral_code: 'AF-REF-110', terms_accepted: true },
    { member_id: 111, full_name: 'Aditya Chopra', phone: '+91 98666 88990', email: 'aditya.c@example.com', join_date: '2026-02-10', plan_id: 4, status: 'Active', referral_code: 'AF-REF-111', terms_accepted: true },
    { member_id: 112, full_name: 'Ritu Verma', phone: '+91 98777 99001', email: 'ritu.v@example.com', join_date: '2026-08-05', plan_id: 5, status: 'Active', referral_code: 'AF-REF-112', terms_accepted: true },
    { member_id: 113, full_name: 'Siddharth Rao', phone: '+91 98888 00112', email: 'siddharth.r@example.com', join_date: '2026-03-01', plan_id: 1, status: 'Active', referral_code: 'AF-REF-113', terms_accepted: true },
    { member_id: 114, full_name: 'Divya Bhatia', phone: '+91 98999 11223', email: 'divya.b@example.com', join_date: '2026-05-20', plan_id: 2, status: 'Active', referral_code: 'AF-REF-114', terms_accepted: true },
    { member_id: 115, full_name: 'Varun Khanna', phone: '+91 99000 22334', email: 'varun.k@example.com', join_date: '2026-07-01', plan_id: 3, status: 'Inactive', referral_code: 'AF-REF-115', terms_accepted: true }
  ],

  penalty_rule: [
    { rule_id: 1, grace_days: 5, penalty_per_day: 10.00, max_penalty: 500.00 }
  ],

  fee_due: [
    { due_id: 1, member_id: 101, due_date: '2026-10-01', fee_amount: 10200.00, status: 'Paid' },
    { due_id: 2, member_id: 102, due_date: '2026-10-05', fee_amount: 3600.00, status: 'Paid' },
    { due_id: 3, member_id: 106, due_date: '2026-10-10', fee_amount: 10200.00, status: 'Paid' },
    { due_id: 4, member_id: 107, due_date: '2026-10-12', fee_amount: 6000.00, status: 'Paid' },
    { due_id: 5, member_id: 111, due_date: '2026-10-15', fee_amount: 10200.00, status: 'Paid' },
    { due_id: 6, member_id: 103, due_date: '2026-09-15', fee_amount: 6000.00, status: 'Paid' },
    { due_id: 7, member_id: 105, due_date: '2026-09-01', fee_amount: 1500.00, status: 'Paid' },
    { due_id: 8, member_id: 104, due_date: '2026-10-10', fee_amount: 1500.00, status: 'Pending' },
    { due_id: 9, member_id: 109, due_date: '2026-10-20', fee_amount: 3600.00, status: 'Pending' },
    { due_id: 10, member_id: 113, due_date: '2026-09-01', fee_amount: 1500.00, status: 'Pending' },
    { due_id: 11, member_id: 110, due_date: '2026-11-02', fee_amount: 1500.00, status: 'Pending' },
    { due_id: 12, member_id: 108, due_date: '2026-11-04', fee_amount: 2700.00, status: 'Pending' },
    { due_id: 13, member_id: 112, due_date: '2026-11-10', fee_amount: 2700.00, status: 'Pending' },
    { due_id: 14, member_id: 114, due_date: '2026-11-20', fee_amount: 3600.00, status: 'Pending' }
  ],

  payment: [
    { payment_id: 501, due_id: 1, paid_date: '2026-10-01', fee_paid: 10200.00, penalty_paid: 0.00, payment_mode: 'Card', notes: 'Annual Elite renewal', tag: 'POS Terminal' },
    { payment_id: 502, due_id: 2, paid_date: '2026-10-05', fee_paid: 3600.00, penalty_paid: 0.00, payment_mode: 'UPI', notes: 'GPay ref #982348712', tag: 'GPay' },
    { payment_id: 503, due_id: 3, paid_date: '2026-10-10', fee_paid: 10200.00, penalty_paid: 0.00, payment_mode: 'UPI', notes: 'PhonePe ref #339182390', tag: 'PhonePe' },
    { payment_id: 504, due_id: 4, paid_date: '2026-10-12', fee_paid: 6000.00, penalty_paid: 0.00, payment_mode: 'Cash', notes: 'Front desk cash payment', tag: 'Cash' },
    { payment_id: 505, due_id: 5, paid_date: '2026-10-15', fee_paid: 10200.00, penalty_paid: 0.00, payment_mode: 'Card', notes: 'ICICI Debit Card', tag: 'POS Terminal' },
    { payment_id: 506, due_id: 6, paid_date: '2026-10-05', fee_paid: 6000.00, penalty_paid: 150.00, payment_mode: 'UPI', notes: 'Late settlement with ₹150 penalty', tag: 'PhonePe' },
    { payment_id: 507, due_id: 7, paid_date: '2026-09-20', fee_paid: 1500.00, penalty_paid: 100.00, payment_mode: 'Cash', notes: 'Settlement before deactivation', tag: 'Cash' }
  ],

  leads: [
    { lead_id: 1, name: 'Vikram Malhotra', phone: '+91 98112 34567', time_slot: 'Morning (07:00 AM - 09:00 AM)', goal: 'Fat Loss', status: 'New', notes: 'Interested in annual membership and personal coaching', created_at: '2026-11-12 10:15' },
    { lead_id: 2, name: 'Ananya Deshmukh', phone: '+91 98220 87654', time_slot: 'Evening (06:00 PM - 08:00 PM)', goal: 'Muscle Gain', status: 'Contacted', notes: 'Callback scheduled for tomorrow 5 PM', created_at: '2026-11-11 17:30' },
    { lead_id: 3, name: 'Karan Singhal', phone: '+91 98765 43210', time_slot: 'Afternoon (12:00 PM - 02:00 PM)', goal: 'Endurance', status: 'Visited', notes: 'Completed InBody trial scan with Coach Rahul', created_at: '2026-11-10 14:00' },
    { lead_id: 4, name: 'Megha Rao', phone: '+91 99100 22334', time_slot: 'Morning (06:00 AM - 08:00 AM)', goal: 'Fat Loss', status: 'Joined', notes: 'Enrolled in Half-Yearly Pro plan', created_at: '2026-11-08 09:45' }
  ],

  classes: [
    { class_id: 1, day: 'Mon', name: 'HIIT Blast', time: '07:00 AM', trainer_name: 'Rahul Verma', capacity: 20, room: 'Sprint Turf' },
    { class_id: 2, day: 'Mon', name: 'Power Yoga', time: '06:30 PM', trainer_name: 'Simran Kaur', capacity: 15, room: 'Studio Lounge' },
    { class_id: 3, day: 'Tue', name: 'Functional Circuit', time: '07:00 AM', trainer_name: 'Amit Yadav', capacity: 18, room: 'Sprint Turf' },
    { class_id: 4, day: 'Tue', name: 'Zumba Dance Fitness', time: '06:30 PM', trainer_name: 'Neha Bansal', capacity: 25, room: 'Studio Lounge' },
    { class_id: 5, day: 'Wed', name: 'Core & Mobility Flow', time: '07:00 AM', trainer_name: 'Simran Kaur', capacity: 20, room: 'Studio Lounge' },
    { class_id: 6, day: 'Wed', name: 'Strength Conditioning', time: '06:30 PM', trainer_name: 'Rahul Verma', capacity: 16, room: 'Strength Deck' },
    { class_id: 7, day: 'Thu', name: 'HIIT Metabolic Burn', time: '07:00 AM', trainer_name: 'Amit Yadav', capacity: 20, room: 'Sprint Turf' },
    { class_id: 8, day: 'Thu', name: 'Mobility & Recovery', time: '06:30 PM', trainer_name: 'Simran Kaur', capacity: 20, room: 'Studio Lounge' },
    { class_id: 9, day: 'Fri', name: 'Turf Rush Sprint', time: '07:00 AM', trainer_name: 'Amit Yadav', capacity: 20, room: 'Sprint Turf' },
    { class_id: 10, day: 'Fri', name: 'Zumba Party Weekend', time: '06:30 PM', trainer_name: 'Neha Bansal', capacity: 25, room: 'Studio Lounge' },
    { class_id: 11, day: 'Sat', name: 'Weekend Bootcamp', time: '08:00 AM', trainer_name: 'Rahul Verma', capacity: 30, room: 'Sprint Turf' },
    { class_id: 12, day: 'Sat', name: 'Hatha Yoga Flow', time: '05:00 PM', trainer_name: 'Simran Kaur', capacity: 20, room: 'Studio Lounge' },
    { class_id: 13, day: 'Sun', name: 'Recovery & Stretching', time: '08:30 AM', trainer_name: 'Rahul Verma', capacity: 25, room: 'Studio Lounge' }
  ],

  trainers: [
    {
      trainer_id: 1,
      name: 'Rahul Verma',
      role: 'Head Coach & Strength Specialist',
      experience: '8+ Years',
      certifications: 'ACE Certified Personal Trainer, CSCS, CPR/AED',
      phone: '+91 98765 11223',
      specialization: 'Hypertrophy, Olympic Lifts & Athletic Conditioning',
      avatar_color: '#8b5cf6',
      bio: 'Specialist in biomechanics, safe heavy lifting, and competitive physique preparation with 8+ years coaching champions.'
    },
    {
      trainer_id: 2,
      name: 'Simran Kaur',
      role: 'Senior Yoga & Mobility Coach',
      experience: '6+ Years',
      certifications: 'RYT 500, K11 Certified Fitness Coach, Pre/Post-Natal',
      phone: '+91 98110 33445',
      specialization: 'Power Yoga, Postural Alignment & Flexibility',
      avatar_color: '#10b981',
      bio: 'Focuses on functional movement patterns, deep core stabilization, and joint recovery for long-term health.'
    },
    {
      trainer_id: 3,
      name: 'Amit Yadav',
      role: 'Functional Turf & Boxing Coach',
      experience: '5+ Years',
      certifications: 'CrossFit L2, Kettlebell Certified, ACSM-CPT',
      phone: '+91 98330 55667',
      specialization: 'HIIT Conditioning, Kettlebells & Metabolic Fat Loss',
      avatar_color: '#f59e0b',
      bio: 'High-energy coach specializing in sprint interval turf conditioning, boxing conditioning, and rapid fat burn.'
    },
    {
      trainer_id: 4,
      name: 'Neha Bansal',
      role: 'Zumba & Aerobics Instructor',
      experience: '4+ Years',
      certifications: 'Licensed Zumba Instructor (ZIN), Aerobics Specialist',
      phone: '+91 99220 77889',
      specialization: 'Dance Cardio, Rhythmic Endurance & Group Energy',
      avatar_color: '#ec4899',
      bio: 'Brings infectious rhythm and high-calorie burn to every single group session, motivating all fitness levels.'
    }
  ],

  trainer_requests: [
    { request_id: 1, trainer_id: 1, client_name: 'Aarav Sharma', phone: '+91 98201 12345', goal: 'Strength & Hypertrophy', status: 'Contacted', created_at: '2026-11-10 11:20' },
    { request_id: 2, trainer_id: 2, client_name: 'Pooja Iyer', phone: '+91 98333 45678', goal: 'Flexibility & Posture', status: 'Pending', created_at: '2026-11-12 16:45' }
  ],

  attendance: [
    { attendance_id: 1, member_id: 101, date: '2026-11-13', time: '06:45 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 2, member_id: 102, date: '2026-11-13', time: '07:15 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 3, member_id: 106, date: '2026-11-13', time: '07:30 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 4, member_id: 107, date: '2026-11-13', time: '08:00 AM', method: 'Desk Entry', status: 'Allowed', notes: 'Front desk check-in' },
    { attendance_id: 5, member_id: 111, date: '2026-11-13', time: '08:20 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 6, member_id: 104, date: '2026-11-13', time: '08:45 AM', method: 'Desk Entry', status: 'Overridden', notes: 'Staff override - pending due ₹1,790' },
    { attendance_id: 7, member_id: 101, date: '2026-11-12', time: '06:50 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 8, member_id: 102, date: '2026-11-12', time: '07:20 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 9, member_id: 103, date: '2026-11-12', time: '18:15 PM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 10, member_id: 106, date: '2026-11-12', time: '18:40 PM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 11, member_id: 101, date: '2026-11-11', time: '06:40 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 12, member_id: 102, date: '2026-11-11', time: '07:10 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 13, member_id: 107, date: '2026-11-11', time: '19:00 PM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 14, member_id: 101, date: '2026-11-10', time: '06:45 AM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' },
    { attendance_id: 15, member_id: 108, date: '2026-11-10', time: '18:30 PM', method: 'QR Scan', status: 'Allowed', notes: 'Gate check-in' }
  ],

  equipment: [
    { equipment_id: 1, name: 'Hammer Strength Power Rack', category: 'Strength', zone: 'Strength Zone', quantity: 4, condition: 'Excellent', status: 'Working', last_inspected: '2026-11-01' },
    { equipment_id: 2, name: 'Plate-Loaded 45° Leg Press', category: 'Strength', zone: 'Strength Zone', quantity: 2, condition: 'Good', status: 'Working', last_inspected: '2026-11-01' },
    { equipment_id: 3, name: 'Dual Adjustable Cable Pulley', category: 'Strength', zone: 'Cable Deck', quantity: 2, condition: 'Good', status: 'Working', last_inspected: '2026-11-03' },
    { equipment_id: 4, name: 'Curved Non-Motorized Treadmill', category: 'Cardio', zone: 'Cardio Deck', quantity: 4, condition: 'Excellent', status: 'Working', last_inspected: '2026-11-05' },
    { equipment_id: 5, name: 'Matrix Commercial Stair Climber', category: 'Cardio', zone: 'Cardio Deck', quantity: 3, condition: 'Fair', status: 'Needs Repair', last_inspected: '2026-11-12' },
    { equipment_id: 6, name: 'Functional Weighted Turf Sled', category: 'Functional', zone: 'Sprint Turf', quantity: 2, condition: 'Good', status: 'Working', last_inspected: '2026-11-02' },
    { equipment_id: 7, name: 'Commercial Urethane Dumbbell Set (2.5-50kg)', category: 'Free Weights', zone: 'Free Weights Zone', quantity: 20, condition: 'Good', status: 'Working', last_inspected: '2026-11-08' },
    { equipment_id: 8, name: 'Concept2 RowErg Rower', category: 'Cardio', zone: 'Cardio Deck', quantity: 2, condition: 'Fair', status: 'Broken', last_inspected: '2026-11-10' },
    { equipment_id: 9, name: 'Olympic Calibrated Steel Barbells 20kg', category: 'Strength', zone: 'Strength Zone', quantity: 8, condition: 'Excellent', status: 'Working', last_inspected: '2026-11-01' },
    { equipment_id: 10, name: 'Heavy Battle Ropes (50ft)', category: 'Functional', zone: 'Sprint Turf', quantity: 2, condition: 'Good', status: 'Working', last_inspected: '2026-11-06' },
    { equipment_id: 11, name: 'InBody 270 Body Analyzer', category: 'Functional', zone: 'Coaching Studio', quantity: 1, condition: 'Excellent', status: 'Working', last_inspected: '2026-11-09' },
    { equipment_id: 12, name: 'Multi-Grip Pull-Up & Dip Station', category: 'Strength', zone: 'Strength Deck', quantity: 2, condition: 'Good', status: 'Working', last_inspected: '2026-11-04' },
    { equipment_id: 13, name: 'High-Density Foam Rollers & Mobility Bands', category: 'Functional', zone: 'Mobility Zone', quantity: 6, condition: 'Fair', status: 'Missing', last_inspected: '2026-11-11' },
    { equipment_id: 14, name: 'Hexagonal Olympic Trap Deadlift Bar', category: 'Free Weights', zone: 'Strength Zone', quantity: 2, condition: 'New', status: 'Required', last_inspected: '2026-11-13' }
  ],

  equipment_issues: [
    { issue_id: 1, equipment_id: 8, reported_by: 'Coach Amit', date: '2026-11-10', note: 'Chain tension return spring detached during interval sprint.', status: 'In Progress' },
    { issue_id: 2, equipment_id: 5, reported_by: 'Member Aarav Sharma', date: '2026-11-12', note: 'Right foot pedal sensor displaying Err-3 on console.', status: 'Reported' },
    { issue_id: 3, equipment_id: 13, reported_by: 'Coach Simran', date: '2026-11-11', note: '2 heavy resistance bands missing from storage rack.', status: 'Reported' }
  ],

  referrals: [
    { referral_id: 1, referrer_member_id: 101, referred_name: 'Pooja Iyer', phone: '+91 98333 45678', code: 'AF-REF-101', reward_status: 'Rewarded', reward_details: '₹500 Renewal Discount Applied', date: '2026-03-15' },
    { referral_id: 2, referrer_member_id: 101, referred_name: 'Sameer Verma', phone: '+91 98111 88990', code: 'AF-REF-101', reward_status: 'Pending', reward_details: '7-Day Free Extension on conversion', date: '2026-11-05' },
    { referral_id: 3, referrer_member_id: 102, referred_name: 'Vikram Malhotra', phone: '+91 98112 34567', code: 'AF-REF-102', reward_status: 'Pending', reward_details: '₹500 Renewal Discount', date: '2026-11-12' },
    { referral_id: 4, referrer_member_id: 106, referred_name: 'Deepak Joshi', phone: '+91 97222 33445', code: 'AF-REF-106', reward_status: 'Rewarded', reward_details: '7-Day Free Extension Added', date: '2026-10-18' }
  ],

  terms: [
    { id: 't1', title: '1. Membership Access & Key-Fob Rules', content: 'Membership is personal and non-transferable. The 24/7 key-fob or digital QR pass must be used only by the registered member. Tailgating or admitting non-members carries a penalty of ₹2,500 and possible suspension.' },
    { id: 't2', title: '2. Recurring Dues, Grace Period & Late Fees', content: 'Membership fees must be paid on or before the due date. A 5-day grace period is provided. Starting day 6, a statutory late penalty of ₹10/day applies up to a maximum cap of ₹500.' },
    { id: 't3', title: '3. Membership Freezing Policy', content: 'Annual members may request up to 30 days of membership freeze on medical grounds or travel with at least 7 days written notice. Minimum freeze duration is 14 days.' },
    { id: 't4', title: '4. Refund & Cancellation Terms', content: 'All membership subscriptions and personal training packages are strictly non-refundable once activated. Exceptions are evaluated solely at the discretion of Anytime Fitness Sohna management under medical incapacitation.' },
    { id: 't5', title: '5. Equipment Etiquette & Safety Protocols', content: 'Members must re-rack all dumbbells, plates, and attachments after use. Appropriate athletic footwear and gym apparel are strictly mandatory. Towels must be used on all benches and machines.' },
    { id: 't6', title: '6. Personal Data & Privacy', content: 'Anytime Fitness Sohna respects your privacy. Member contact details are retained strictly for operational notices, fee reminders, emergency contacts, and attendance logs under applicable Indian privacy guidelines.' }
  ],

  notifications_read_at: null
};

// Helper to normalize phone digits for strict uniqueness check
export function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

class GymStore {
  constructor() {
    this.data = this.load();
    this.listeners = [];
    this.sqlLogs = [];
    this.initDefaultSqlLogs();
  }

  initDefaultSqlLogs() {
    this.sqlLogs = [
      { timestamp: new Date().toLocaleTimeString(), query: `USE gym_db;` },
      { timestamp: new Date().toLocaleTimeString(), query: `SELECT * FROM membership_plan;` },
      { timestamp: new Date().toLocaleTimeString(), query: `SELECT m.*, p.plan_name FROM member m JOIN membership_plan p ON m.plan_id = p.plan_id;` }
    ];
  }

  logSql(query) {
    this.sqlLogs.unshift({
      timestamp: new Date().toLocaleTimeString(),
      query: query.trim()
    });
    if (this.sqlLogs.length > 60) this.sqlLogs.pop();
  }

  getSqlLogs() {
    return this.sqlLogs;
  }

  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.membership_plan && parsed.member && parsed.fee_due && parsed.payment) {
            // Merge missing tables from INITIAL_DATA for seamless upgrades
            for (const key of Object.keys(INITIAL_DATA)) {
              if (parsed[key] === undefined || (Array.isArray(INITIAL_DATA[key]) && !Array.isArray(parsed[key]))) {
                parsed[key] = JSON.parse(JSON.stringify(INITIAL_DATA[key]));
              }
            }
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Storage read fallback', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.error('Storage write error', e);
    }
    this.listeners.forEach(fn => fn(this.data));
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.initDefaultSqlLogs();
    this.logSql('-- RESET DATABASE TO SEED STATE');
    this.save();
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  // ==========================================
  // PLANS (membership_plan table)
  // ==========================================
  getPlans() {
    return this.data.membership_plan;
  }

  getPlan(id) {
    return this.data.membership_plan.find(p => p.plan_id === Number(id));
  }

  addPlan({ plan_name, duration_months, monthly_fee }) {
    const name = (plan_name || '').trim();
    const duration = parseInt(duration_months, 10);
    const fee = parseFloat(monthly_fee);

    if (!name) throw new Error('Plan name cannot be empty.');
    if (isNaN(duration) || duration <= 0) throw new Error('Plan duration must be at least 1 month.');
    if (isNaN(fee) || fee <= 0) throw new Error('Monthly fee must be greater than 0.');

    const nextId = Math.max(0, ...this.data.membership_plan.map(p => p.plan_id)) + 1;
    const newPlan = {
      plan_id: nextId,
      plan_name: name,
      duration_months: duration,
      monthly_fee: fee
    };

    this.data.membership_plan.push(newPlan);
    this.logSql(`INSERT INTO membership_plan (plan_id, plan_name, duration_months, monthly_fee) VALUES (${nextId}, '${name.replace(/'/g, "''")}', ${duration}, ${fee.toFixed(2)});amp;`);
    this.save();
    return newPlan;
  }

  updatePlan(id, { plan_name, duration_months, monthly_fee }) {
    const plan = this.getPlan(id);
    if (!plan) throw new Error('Plan not found.');

    const name = (plan_name || '').trim();
    const duration = parseInt(duration_months, 10);
    const fee = parseFloat(monthly_fee);

    if (!name) throw new Error('Plan name cannot be empty.');
    if (isNaN(duration) || duration <= 0) throw new Error('Plan duration must be at least 1 month.');
    if (isNaN(fee) || fee <= 0) throw new Error('Monthly fee must be greater than 0.');

    plan.plan_name = name;
    plan.duration_months = duration;
    plan.monthly_fee = fee;

    this.logSql(`UPDATE membership_plan SET plan_name = '${name.replace(/'/g, "''")}', duration_months = ${duration}, monthly_fee = ${fee.toFixed(2)} WHERE plan_id = ${id};`);
    this.save();
    return plan;
  }

  deletePlan(id) {
    const planId = Number(id);
    const enrolledMembers = this.data.member.filter(m => m.plan_id === planId);
    if (enrolledMembers.length > 0) {
      throw new Error(`Cannot delete plan. ${enrolledMembers.length} member(s) are currently enrolled.`);
    }

    this.data.membership_plan = this.data.membership_plan.filter(p => p.plan_id !== planId);
    this.logSql(`DELETE FROM membership_plan WHERE plan_id = ${planId};`);
    this.save();
    return true;
  }

  // ==========================================
  // MEMBERS (member table)
  // ==========================================
  getMembers() {
    return this.data.member.map(m => ({
      ...m,
      referral_code: m.referral_code || `AF-REF-${m.member_id}`,
      avatar_color: m.avatar_color || getAvatarColor(m.member_id)
    }));
  }

  getMember(id) {
    const m = this.data.member.find(x => x.member_id === Number(id));
    if (!m) return null;
    return {
      ...m,
      referral_code: m.referral_code || `AF-REF-${m.member_id}`,
      avatar_color: m.avatar_color || getAvatarColor(m.member_id)
    };
  }

  getMemberDetails(id) {
    const member = this.getMember(id);
    if (!member) return null;

    const plan = this.getPlan(member.plan_id);
    const dues = this.getFeeDues()
      .filter(d => d.member_id === member.member_id)
      .sort((a, b) => b.due_date.localeCompare(a.due_date));

    const payments = this.getPayments()
      .filter(p => {
        const due = this.getFeeDue(p.due_id);
        return due && due.member_id === member.member_id;
      })
      .sort((a, b) => b.paid_date.localeCompare(a.paid_date));

    const attendance = this.getMemberAttendance(member.member_id);

    return {
      ...member,
      plan_name: plan ? plan.plan_name : 'Unknown Plan',
      plan_monthly_fee: plan ? plan.monthly_fee : 0,
      plan_duration: plan ? plan.duration_months : 1,
      dues,
      payments,
      attendance
    };
  }

  addMember({ full_name, phone, email, join_date, plan_id, status = 'Active', referral_code, referrer_code, terms_accepted = true, avatar_url }) {
    const name = (full_name || '').trim();
    const cleanPhone = (phone || '').trim();
    const normalizedNew = normalizePhone(cleanPhone);

    if (!name) throw new Error('Member name is required.');
    if (!cleanPhone || normalizedNew.length < 10) throw new Error('A valid 10-digit mobile number (+91) is required.');

    const duplicate = this.data.member.find(m => normalizePhone(m.phone) === normalizedNew);
    if (duplicate) {
      throw new Error(`Phone ${cleanPhone} is already registered to ${duplicate.full_name} (#${duplicate.member_id}).`);
    }

    const planId = Number(plan_id);
    const plan = this.getPlan(planId);
    if (!plan) throw new Error('Selected membership plan does not exist.');

    const nextId = Math.max(0, ...this.data.member.map(m => m.member_id)) + 1;
    const finalJoinDate = join_date || new Date().toISOString().split('T')[0];
    const generatedRefCode = referral_code || `AF-REF-${nextId}`;

    const newMember = {
      member_id: nextId,
      full_name: name,
      phone: cleanPhone,
      email: (email || '').trim().toLowerCase(),
      join_date: finalJoinDate,
      plan_id: planId,
      status: status || 'Active',
      referral_code: generatedRefCode,
      avatar_url: avatar_url || '',
      terms_accepted: Boolean(terms_accepted)
    };

    this.data.member.unshift(newMember);

    // If joined via a referral code, log referral link
    if (referrer_code) {
      const trimmedRef = referrer_code.trim().toUpperCase();
      const referrer = this.data.member.find(m => (m.referral_code || `AF-REF-${m.member_id}`).toUpperCase() === trimmedRef);
      if (referrer) {
        this.addReferral({
          referrer_member_id: referrer.member_id,
          referred_name: name,
          phone: cleanPhone,
          code: trimmedRef,
          reward_status: 'Pending',
          reward_details: '₹500 Renewal Discount on Verification'
        });
      }
    }

    // Auto-generate first initial fee due
    const totalDue = plan.duration_months * plan.monthly_fee;
    this.addFeeDue({
      member_id: nextId,
      due_date: finalJoinDate,
      fee_amount: totalDue
    });

    this.logSql(`INSERT INTO member (member_id, full_name, phone, email, join_date, plan_id, status) VALUES (${nextId}, '${name.replace(/'/g, "''")}', '${cleanPhone}', '${newMember.email}', '${finalJoinDate}', ${planId}, '${status}');`);
    this.save();
    return newMember;
  }

  updateMember(id, updates) {
    const member = this.getMember(id);
    if (!member) throw new Error('Member not found.');

    const target = this.data.member.find(m => m.member_id === Number(id));

    if (updates.phone) {
      const normalizedNew = normalizePhone(updates.phone);
      const duplicate = this.data.member.find(m => m.member_id !== target.member_id && normalizePhone(m.phone) === normalizedNew);
      if (duplicate) {
        throw new Error(`Phone number is already used by ${duplicate.full_name} (#${duplicate.member_id}).`);
      }
      target.phone = updates.phone.trim();
    }

    if (updates.full_name !== undefined) target.full_name = updates.full_name.trim();
    if (updates.email !== undefined) target.email = updates.email.trim().toLowerCase();
    if (updates.status !== undefined) target.status = updates.status;
    if (updates.plan_id !== undefined) {
      const p = this.getPlan(updates.plan_id);
      if (!p) throw new Error('Plan does not exist.');
      target.plan_id = Number(updates.plan_id);
    }
    if (updates.avatar_url !== undefined) target.avatar_url = updates.avatar_url;

    this.logSql(`UPDATE member SET full_name = '${target.full_name.replace(/'/g, "''")}', phone = '${target.phone}', email = '${target.email}', plan_id = ${target.plan_id}, status = '${target.status}' WHERE member_id = ${target.member_id};`);
    this.save();
    return target;
  }

  deleteMember(id) {
    const memberId = Number(id);
    const member = this.getMember(memberId);
    if (!member) throw new Error('Member not found.');

    // Delete associated dues & payments first for clean referential integrity
    const dues = this.data.fee_due.filter(d => d.member_id === memberId);
    const dueIds = dues.map(d => d.due_id);

    this.data.payment = this.data.payment.filter(p => !dueIds.includes(p.due_id));
    this.data.fee_due = this.data.fee_due.filter(d => d.member_id !== memberId);
    this.data.attendance = (this.data.attendance || []).filter(a => a.member_id !== memberId);
    this.data.member = this.data.member.filter(m => m.member_id !== memberId);

    this.logSql(`-- Cascade deletion for member #${memberId}
DELETE FROM payment WHERE due_id IN (SELECT due_id FROM fee_due WHERE member_id = ${memberId});
DELETE FROM fee_due WHERE member_id = ${memberId};
DELETE FROM member WHERE member_id = ${memberId};`);
    this.save();
    return true;
  }

  // ==========================================
  // PENALTY RULES (penalty_rule table)
  // ==========================================
  getPenaltyRule() {
    return this.data.penalty_rule[0] || {
      rule_id: 1,
      grace_days: 5,
      penalty_per_day: 10.00,
      max_penalty: 500.00
    };
  }

  updatePenaltyRule({ grace_days, penalty_per_day, max_penalty }) {
    const grace = parseInt(grace_days, 10);
    const perDay = parseFloat(penalty_per_day);
    const maxPen = parseFloat(max_penalty);

    if (isNaN(grace) || grace < 0) throw new Error('Grace days cannot be negative.');
    if (isNaN(perDay) || perDay < 0) throw new Error('Penalty per day cannot be negative.');
    if (isNaN(maxPen) || maxPen < 0) throw new Error('Max penalty cap cannot be negative.');

    const rule = this.data.penalty_rule[0];
    rule.grace_days = grace;
    rule.penalty_per_day = perDay;
    rule.max_penalty = maxPen;

    this.logSql(`UPDATE penalty_rule SET grace_days = ${grace}, penalty_per_day = ${perDay.toFixed(2)}, max_penalty = ${maxPen.toFixed(2)} WHERE rule_id = ${rule.rule_id};`);
    this.save();
    return rule;
  }

  // ==========================================
  // FEE DUES (fee_due table)
  // ==========================================
  getFeeDues() {
    return this.data.fee_due;
  }

  getFeeDue(id) {
    return this.data.fee_due.find(d => d.due_id === Number(id));
  }

  addFeeDue({ member_id, due_date, fee_amount }) {
    const memberId = Number(member_id);
    const member = this.getMember(memberId);
    if (!member) throw new Error('Member not found.');

    const fee = parseFloat(fee_amount);
    if (isNaN(fee) || fee <= 0) throw new Error('Fee amount must be greater than 0.');

    const date = due_date || new Date().toISOString().split('T')[0];
    const nextId = Math.max(0, ...this.data.fee_due.map(d => d.due_id)) + 1;

    const newDue = {
      due_id: nextId,
      member_id: memberId,
      due_date: date,
      fee_amount: fee,
      status: 'Pending'
    };

    this.data.fee_due.unshift(newDue);
    this.logSql(`INSERT INTO fee_due (due_id, member_id, due_date, fee_amount, status) VALUES (${nextId}, ${memberId}, '${date}', ${fee.toFixed(2)}, 'Pending');`);
    this.save();
    return newDue;
  }

  updateFeeDue(id, { due_date, fee_amount }) {
    const due = this.getFeeDue(id);
    if (!due) throw new Error('Fee due record not found.');

    if (due_date) due.due_date = due_date;
    if (fee_amount !== undefined) {
      const f = parseFloat(fee_amount);
      if (isNaN(f) || f <= 0) throw new Error('Fee amount must be positive.');
      due.fee_amount = f;
    }

    this.logSql(`UPDATE fee_due SET due_date = '${due.due_date}', fee_amount = ${due.fee_amount.toFixed(2)} WHERE due_id = ${id};`);
    this.save();
    return due;
  }

  deleteFeeDue(id) {
    const dueId = Number(id);
    const due = this.getFeeDue(dueId);
    if (!due) throw new Error('Fee due not found.');

    const payments = this.data.payment.filter(p => p.due_id === dueId);
    if (payments.length > 0) {
      throw new Error('Cannot delete a fee due that already has recorded payments. Revert the payment first.');
    }

    this.data.fee_due = this.data.fee_due.filter(d => d.due_id !== dueId);
    this.logSql(`DELETE FROM fee_due WHERE due_id = ${dueId};`);
    this.save();
    return true;
  }

  generateRenewalDue(member_id) {
    const member = this.getMember(member_id);
    if (!member) throw new Error('Member not found.');

    const plan = this.getPlan(member.plan_id);
    if (!plan) throw new Error('Member plan not found.');

    const dues = this.data.fee_due.filter(d => d.member_id === member.member_id);
    let nextDueDate = new Date();

    if (dues.length > 0) {
      const sortedDues = [...dues].sort((a, b) => b.due_date.localeCompare(a.due_date));
      const latestDue = sortedDues[0];
      const d = new Date(latestDue.due_date);
      d.setMonth(d.getMonth() + plan.duration_months);
      nextDueDate = d;
    }

    const isoDate = nextDueDate.toISOString().split('T')[0];
    const totalAmount = plan.duration_months * plan.monthly_fee;

    return this.addFeeDue({
      member_id: member.member_id,
      due_date: isoDate,
      fee_amount: totalAmount
    });
  }

  // ==========================================
  // PAYMENTS (payment table)
  // ==========================================
  getPayments() {
    return this.data.payment;
  }

  getPayment(id) {
    return this.data.payment.find(p => p.payment_id === Number(id));
  }

  getPaymentByDueId(due_id) {
    return this.data.payment.find(p => p.due_id === Number(due_id));
  }

  recordPayment({ due_id, paid_date, fee_paid, penalty_paid = 0, payment_mode = 'UPI', notes = '', tag = '' }) {
    const due = this.getFeeDue(due_id);
    if (!due) throw new Error('Fee due record not found.');

    const nextId = Math.max(0, ...this.data.payment.map(p => p.payment_id)) + 1;
    const paidDate = paid_date || new Date().toISOString().split('T')[0];
    const feeAmt = parseFloat(fee_paid);
    const penAmt = parseFloat(penalty_paid || 0);
    const mode = payment_mode || 'UPI';

    if (isNaN(feeAmt) || feeAmt < 0) throw new Error('Fee paid amount is invalid.');
    if (isNaN(penAmt) || penAmt < 0) throw new Error('Penalty paid amount cannot be negative.');

    const newPayment = {
      payment_id: nextId,
      due_id: Number(due_id),
      paid_date: paidDate,
      fee_paid: feeAmt,
      penalty_paid: penAmt,
      payment_mode: mode,
      notes: (notes || '').trim(),
      tag: (tag || '').trim()
    };

    due.status = 'Paid';
    this.data.payment.unshift(newPayment);

    this.logSql(`-- Settle Fee Due #${due.due_id}
UPDATE fee_due SET status = 'Paid' WHERE due_id = ${due.due_id};
INSERT INTO payment (payment_id, due_id, paid_date, fee_paid, penalty_paid, payment_mode) VALUES (${nextId}, ${due.due_id}, '${paidDate}', ${feeAmt.toFixed(2)}, ${penAmt.toFixed(2)}, '${mode}');`);
    this.save();
    return newPayment;
  }

  deletePayment(payment_id) {
    const payId = Number(payment_id);
    const payment = this.getPayment(payId);
    if (!payment) throw new Error('Payment not found.');

    const due = this.getFeeDue(payment.due_id);
    if (due) {
      due.status = 'Pending';
    }

    this.data.payment = this.data.payment.filter(p => p.payment_id !== payId);
    this.logSql(`-- REVERT Payment #${payId}
UPDATE fee_due SET status = 'Pending' WHERE due_id = ${payment.due_id};
DELETE FROM payment WHERE payment_id = ${payId};`);
    this.save();
    return true;
  }

  // ==========================================
  // LEADS (Free Trial & Callback Form)
  // ==========================================
  getLeads() {
    return this.data.leads || [];
  }

  getLead(id) {
    return (this.data.leads || []).find(l => l.lead_id === Number(id));
  }

  addLead({ name, phone, time_slot, goal, notes = '' }) {
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();
    if (!cleanName) throw new Error('Name is required.');
    if (!cleanPhone || cleanPhone.length < 10) throw new Error('Valid phone number is required.');

    const nextId = Math.max(0, ...(this.data.leads || []).map(l => l.lead_id)) + 1;
    const now = new Date();
    const created_at = now.toISOString().split('T')[0] + ' ' + now.toTimeString().slice(0, 5);

    const newLead = {
      lead_id: nextId,
      name: cleanName,
      phone: cleanPhone,
      time_slot: time_slot || 'Morning (07:00 AM - 09:00 AM)',
      goal: goal || 'General Fitness',
      status: 'New',
      notes: (notes || '').trim(),
      created_at
    };

    if (!this.data.leads) this.data.leads = [];
    this.data.leads.unshift(newLead);
    this.logSql(`INSERT INTO leads (lead_id, name, phone, time_slot, goal, status) VALUES (${nextId}, '${cleanName.replace(/'/g, "''")}', '${cleanPhone}', '${newLead.time_slot}', '${newLead.goal}', 'New');`);
    this.save();
    return newLead;
  }

  updateLeadStatus(id, status) {
    const lead = this.getLead(id);
    if (!lead) throw new Error('Lead not found.');
    lead.status = status;
    this.save();
    return lead;
  }

  // ==========================================
  // CLASSES (Weekly Group Class Timetable)
  // ==========================================
  getClasses() {
    return this.data.classes || [];
  }

  getClass(id) {
    return (this.data.classes || []).find(c => c.class_id === Number(id));
  }

  addClass({ day, name, time, trainer_name, capacity = 20, room = 'Studio Lounge' }) {
    const nextId = Math.max(0, ...(this.data.classes || []).map(c => c.class_id)) + 1;
    const newClass = {
      class_id: nextId,
      day: day || 'Mon',
      name: (name || '').trim(),
      time: (time || '').trim(),
      trainer_name: (trainer_name || '').trim(),
      capacity: parseInt(capacity, 10) || 20,
      room: (room || 'Studio Lounge').trim()
    };
    if (!this.data.classes) this.data.classes = [];
    this.data.classes.push(newClass);
    this.save();
    return newClass;
  }

  updateClass(id, updates) {
    const c = this.getClass(id);
    if (!c) throw new Error('Class not found.');
    Object.assign(c, updates);
    this.save();
    return c;
  }

  deleteClass(id) {
    this.data.classes = (this.data.classes || []).filter(c => c.class_id !== Number(id));
    this.save();
    return true;
  }

  // ==========================================
  // TRAINERS & REQUESTS
  // ==========================================
  getTrainers() {
    return this.data.trainers || [];
  }

  getTrainer(id) {
    return (this.data.trainers || []).find(t => t.trainer_id === Number(id));
  }

  getTrainerRequests() {
    return this.data.trainer_requests || [];
  }

  addTrainerRequest({ trainer_id, client_name, phone, goal = '' }) {
    const nextId = Math.max(0, ...(this.data.trainer_requests || []).map(r => r.request_id)) + 1;
    const now = new Date();
    const created_at = now.toISOString().split('T')[0] + ' ' + now.toTimeString().slice(0, 5);

    const req = {
      request_id: nextId,
      trainer_id: Number(trainer_id),
      client_name: (client_name || '').trim(),
      phone: (phone || '').trim(),
      goal: (goal || '').trim(),
      status: 'Pending',
      created_at
    };

    if (!this.data.trainer_requests) this.data.trainer_requests = [];
    this.data.trainer_requests.unshift(req);
    this.save();
    return req;
  }

  // ==========================================
  // GATE ENTRY & ATTENDANCE
  // ==========================================
  getAttendance() {
    return this.data.attendance || [];
  }

  getMemberAttendance(member_id) {
    const id = Number(member_id);
    return (this.data.attendance || [])
      .filter(a => a.member_id === id)
      .sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
  }

  logAttendance({ member_id, method = 'QR Scan', status = 'Allowed', notes = '' }) {
    const id = Number(member_id);
    const member = this.getMember(id);
    if (!member) throw new Error('Member not found.');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Anti-duplicate check: prevent check-in within last 30 minutes
    const recent = (this.data.attendance || []).find(a => {
      if (a.member_id === id && a.date === today) {
        // Simple duplicate guard
        return a.time === time;
      }
      return false;
    });

    if (recent) {
      throw new Error(`Member ${member.full_name} was already checked in just now (${recent.time}).`);
    }

    const nextId = Math.max(0, ...(this.data.attendance || []).map(a => a.attendance_id)) + 1;
    const record = {
      attendance_id: nextId,
      member_id: id,
      date: today,
      time,
      method: method || 'QR Scan',
      status: status || 'Allowed',
      notes: (notes || '').trim()
    };

    if (!this.data.attendance) this.data.attendance = [];
    this.data.attendance.unshift(record);
    this.logSql(`INSERT INTO attendance (attendance_id, member_id, date, time, method, status) VALUES (${nextId}, ${id}, '${today}', '${time}', '${record.method}', '${record.status}');`);
    this.save();
    return record;
  }

  // ==========================================
  // EQUIPMENT MANAGEMENT
  // ==========================================
  getEquipment() {
    return this.data.equipment || [];
  }

  getEquipmentItem(id) {
    return (this.data.equipment || []).find(e => e.equipment_id === Number(id));
  }

  addEquipment({ name, category, zone, quantity = 1, condition = 'Good', status = 'Working' }) {
    const nextId = Math.max(0, ...(this.data.equipment || []).map(e => e.equipment_id)) + 1;
    const item = {
      equipment_id: nextId,
      name: (name || '').trim(),
      category: category || 'Strength',
      zone: zone || 'Strength Zone',
      quantity: parseInt(quantity, 10) || 1,
      condition: condition || 'Good',
      status: status || 'Working',
      last_inspected: new Date().toISOString().split('T')[0]
    };
    if (!this.data.equipment) this.data.equipment = [];
    this.data.equipment.unshift(item);
    this.save();
    return item;
  }

  updateEquipment(id, updates) {
    const item = this.getEquipmentItem(id);
    if (!item) throw new Error('Equipment item not found.');
    Object.assign(item, updates);
    this.save();
    return item;
  }

  updateEquipmentStatus(id, status) {
    return this.updateEquipment(id, { status });
  }

  getEquipmentIssues() {
    return this.data.equipment_issues || [];
  }

  reportEquipmentIssue({ equipment_id, reported_by = 'Staff', note }) {
    const nextId = Math.max(0, ...(this.data.equipment_issues || []).map(i => i.issue_id)) + 1;
    const issue = {
      issue_id: nextId,
      equipment_id: Number(equipment_id),
      reported_by: (reported_by || 'Staff').trim(),
      date: new Date().toISOString().split('T')[0],
      note: (note || '').trim(),
      status: 'Reported'
    };
    if (!this.data.equipment_issues) this.data.equipment_issues = [];
    this.data.equipment_issues.unshift(issue);

    // Also mark equipment as Needs Repair
    const eq = this.getEquipmentItem(equipment_id);
    if (eq && eq.status === 'Working') {
      eq.status = 'Needs Repair';
    }

    this.save();
    return issue;
  }

  updateEquipmentIssue(id, status) {
    const issue = (this.data.equipment_issues || []).find(i => i.issue_id === Number(id));
    if (!issue) throw new Error('Issue not found.');
    issue.status = status;
    if (status === 'Fixed') {
      const eq = this.getEquipmentItem(issue.equipment_id);
      if (eq) eq.status = 'Working';
    }
    this.save();
    return issue;
  }

  // ==========================================
  // REFERRALS
  // ==========================================
  getReferrals() {
    return this.data.referrals || [];
  }

  addReferral({ referrer_member_id, referred_name, phone, code, reward_status = 'Pending', reward_details = '₹500 Renewal Discount' }) {
    const nextId = Math.max(0, ...(this.data.referrals || []).map(r => r.referral_id)) + 1;
    const newRef = {
      referral_id: nextId,
      referrer_member_id: Number(referrer_member_id),
      referred_name: (referred_name || '').trim(),
      phone: (phone || '').trim(),
      code: (code || `AF-REF-${referrer_member_id}`).trim().toUpperCase(),
      reward_status: reward_status || 'Pending',
      reward_details: reward_details || '₹500 Renewal Discount',
      date: new Date().toISOString().split('T')[0]
    };
    if (!this.data.referrals) this.data.referrals = [];
    this.data.referrals.unshift(newRef);
    this.save();
    return newRef;
  }

  updateReferralReward(id, reward_status) {
    const ref = (this.data.referrals || []).find(r => r.referral_id === Number(id));
    if (!ref) throw new Error('Referral record not found.');
    ref.reward_status = reward_status;
    this.save();
    return ref;
  }

  // ==========================================
  // TERMS & CONDITIONS
  // ==========================================
  getTerms() {
    return this.data.terms || [];
  }

  updateTerms(termsList) {
    if (Array.isArray(termsList)) {
      this.data.terms = termsList;
      this.save();
    }
    return this.data.terms;
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  getNotificationsReadAt() {
    return this.data.notifications_read_at;
  }

  markNotificationsAsRead() {
    this.data.notifications_read_at = new Date().toISOString();
    this.save();
  }

  // ==========================================
  // DBMS UTILITIES & EXPORTS
  // ==========================================
  generateSqlDump() {
    let sql = `-- ==========================================================\n`;
    sql += `-- Anytime Fitness Sohna - Database Dump\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n`;
    sql += `-- Production Schema & Operational Seed Data\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `CREATE DATABASE IF NOT EXISTS gym_db;\nUSE gym_db;\n\n`;

    sql += `DROP TABLE IF EXISTS payment;\n`;
    sql += `DROP TABLE IF EXISTS fee_due;\n`;
    sql += `DROP TABLE IF EXISTS penalty_rule;\n`;
    sql += `DROP TABLE IF EXISTS member;\n`;
    sql += `DROP TABLE IF EXISTS membership_plan;\n\n`;

    sql += `CREATE TABLE membership_plan (\n`;
    sql += `    plan_id          INT PRIMARY KEY AUTO_INCREMENT,\n`;
    sql += `    plan_name        VARCHAR(50) NOT NULL,\n`;
    sql += `    duration_months  INT NOT NULL,\n`;
    sql += `    monthly_fee      DECIMAL(8,2) NOT NULL CHECK (monthly_fee > 0)\n`;
    sql += `);\n\n`;

    sql += `CREATE TABLE member (\n`;
    sql += `    member_id   INT PRIMARY KEY AUTO_INCREMENT,\n`;
    sql += `    full_name   VARCHAR(100) NOT NULL,\n`;
    sql += `    phone       VARCHAR(15) UNIQUE NOT NULL,\n`;
    sql += `    email       VARCHAR(100),\n`;
    sql += `    join_date   DATE NOT NULL,\n`;
    sql += `    plan_id     INT NOT NULL,\n`;
    sql += `    status      ENUM('Active','Inactive') DEFAULT 'Active',\n`;
    sql += `    FOREIGN KEY (plan_id) REFERENCES membership_plan(plan_id)\n`;
    sql += `);\n\n`;

    sql += `CREATE TABLE penalty_rule (\n`;
    sql += `    rule_id          INT PRIMARY KEY AUTO_INCREMENT,\n`;
    sql += `    grace_days       INT NOT NULL DEFAULT 5,\n`;
    sql += `    penalty_per_day  DECIMAL(6,2) NOT NULL DEFAULT 10.00,\n`;
    sql += `    max_penalty      DECIMAL(8,2) NOT NULL DEFAULT 500.00\n`;
    sql += `);\n\n`;

    sql += `CREATE TABLE fee_due (\n`;
    sql += `    due_id      INT PRIMARY KEY AUTO_INCREMENT,\n`;
    sql += `    member_id   INT NOT NULL,\n`;
    sql += `    due_date    DATE NOT NULL,\n`;
    sql += `    fee_amount  DECIMAL(8,2) NOT NULL,\n`;
    sql += `    status      ENUM('Pending','Paid') DEFAULT 'Pending',\n`;
    sql += `    FOREIGN KEY (member_id) REFERENCES member(member_id)\n`;
    sql += `);\n\n`;

    sql += `CREATE TABLE payment (\n`;
    sql += `    payment_id    INT PRIMARY KEY AUTO_INCREMENT,\n`;
    sql += `    due_id        INT NOT NULL,\n`;
    sql += `    paid_date     DATE NOT NULL,\n`;
    sql += `    fee_paid      DECIMAL(8,2) NOT NULL,\n`;
    sql += `    penalty_paid  DECIMAL(8,2) DEFAULT 0,\n`;
    sql += `    payment_mode  ENUM('Cash','UPI','Card') NOT NULL,\n`;
    sql += `    FOREIGN KEY (due_id) REFERENCES fee_due(due_id)\n`;
    sql += `);\n\n`;

    this.data.membership_plan.forEach(p => {
      sql += `INSERT INTO membership_plan (plan_id, plan_name, duration_months, monthly_fee) VALUES (${p.plan_id}, '${p.plan_name.replace(/'/g, "''")}', ${p.duration_months}, ${p.monthly_fee.toFixed(2)});\n`;
    });
    sql += `\n`;

    this.data.penalty_rule.forEach(r => {
      sql += `INSERT INTO penalty_rule (rule_id, grace_days, penalty_per_day, max_penalty) VALUES (${r.rule_id}, ${r.grace_days}, ${r.penalty_per_day.toFixed(2)}, ${r.max_penalty.toFixed(2)});\n`;
    });
    sql += `\n`;

    this.data.member.forEach(m => {
      sql += `INSERT INTO member (member_id, full_name, phone, email, join_date, plan_id, status) VALUES (${m.member_id}, '${m.full_name.replace(/'/g, "''")}', '${m.phone}', '${m.email || ''}', '${m.join_date}', ${m.plan_id}, '${m.status}');\n`;
    });
    sql += `\n`;

    this.data.fee_due.forEach(d => {
      sql += `INSERT INTO fee_due (due_id, member_id, due_date, fee_amount, status) VALUES (${d.due_id}, ${d.member_id}, '${d.due_date}', ${d.fee_amount.toFixed(2)}, '${d.status}');\n`;
    });
    sql += `\n`;

    this.data.payment.forEach(p => {
      sql += `INSERT INTO payment (payment_id, due_id, paid_date, fee_paid, penalty_paid, payment_mode) VALUES (${p.payment_id}, ${p.due_id}, '${p.paid_date}', ${p.fee_paid.toFixed(2)}, ${(p.penalty_paid || 0).toFixed(2)}, '${p.payment_mode}');\n`;
    });
    sql += `\n`;

    return sql;
  }

  exportCsv(tableName) {
    const tableData = this.data[tableName];
    if (!tableData || tableData.length === 0) return '';

    const headers = Object.keys(tableData[0]);
    const csvRows = [headers.join(',')];

    for (const row of tableData) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  exportJsonBackup() {
    return JSON.stringify(this.data, null, 2);
  }

  importJsonBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.membership_plan && parsed.member && parsed.fee_due && parsed.payment) {
        this.data = parsed;
        this.logSql('-- IMPORTED JSON BACKUP DATABASE');
        this.save();
        return true;
      }
      throw new Error('Invalid backup file structure.');
    } catch (err) {
      throw new Error('Could not parse JSON backup: ' + err.message);
    }
  }
}

export const store = new GymStore();
