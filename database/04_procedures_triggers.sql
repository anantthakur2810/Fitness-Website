-- ============================================================================
-- APEX GYM MANAGEMENT SYSTEM — STORED PROCEDURES & TRIGGERS
-- File: database/04_procedures_triggers.sql
-- Transaction management and automated business rule enforcement
-- ============================================================================

USE gym_db;

DELIMITER //

-- ----------------------------------------------------------------------------
-- Stored Procedure 1: sp_record_payment
-- Settles a fee due within an ACID transaction and inserts the payment receipt
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_record_payment //
CREATE PROCEDURE sp_record_payment (
    IN p_due_id INT,
    IN p_paid_date DATE,
    IN p_fee_paid DECIMAL(8,2),
    IN p_penalty_paid DECIMAL(8,2),
    IN p_payment_mode VARCHAR(10),
    IN p_notes VARCHAR(255)
)
BEGIN
    DECLARE v_current_status VARCHAR(10);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback transaction on any unexpected SQL error
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validate fee due exists
    SELECT status INTO v_current_status FROM fee_due WHERE due_id = p_due_id;

    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Fee due record does not exist.';
    ELSEIF v_current_status = 'Paid' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Fee due is already marked as Paid.';
    ELSE
        START TRANSACTION;
            -- 1. Insert payment ledger entry
            INSERT INTO payment (due_id, paid_date, fee_paid, penalty_paid, payment_mode, notes)
            VALUES (p_due_id, p_paid_date, p_fee_paid, p_penalty_paid, p_payment_mode, p_notes);

            -- 2. Mark the corresponding fee_due as Paid
            UPDATE fee_due 
            SET status = 'Paid' 
            WHERE due_id = p_due_id;
        COMMIT;
    END IF;
END //

-- ----------------------------------------------------------------------------
-- Stored Procedure 2: sp_renew_member_plan
-- Automatically calculates next billing cycle due date and generates fee due
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_renew_member_plan //
CREATE PROCEDURE sp_renew_member_plan (
    IN p_member_id INT
)
BEGIN
    DECLARE v_plan_id INT;
    DECLARE v_duration INT;
    DECLARE v_monthly_fee DECIMAL(8,2);
    DECLARE v_last_due_date DATE;
    DECLARE v_next_due_date DATE;
    DECLARE v_fee_amount DECIMAL(8,2);

    -- Fetch member's current plan
    SELECT m.plan_id, p.duration_months, p.monthly_fee
    INTO v_plan_id, v_duration, v_monthly_fee
    FROM member m
    JOIN membership_plan p ON m.plan_id = p.plan_id
    WHERE m.member_id = p_member_id;

    IF v_plan_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Member or assigned plan not found.';
    END IF;

    -- Find latest due date for this member
    SELECT MAX(due_date) INTO v_last_due_date 
    FROM fee_due 
    WHERE member_id = p_member_id;

    IF v_last_due_date IS NOT NULL THEN
        SET v_next_due_date = DATE_ADD(v_last_due_date, INTERVAL v_duration MONTH);
    ELSE
        SET v_next_due_date = CURRENT_DATE;
    END IF;

    SET v_fee_amount = v_duration * v_monthly_fee;

    -- Insert new scheduled fee due
    INSERT INTO fee_due (member_id, due_date, fee_amount, status)
    VALUES (p_member_id, v_next_due_date, v_fee_amount, 'Pending');
END //

-- ----------------------------------------------------------------------------
-- Trigger: trg_validate_payment
-- Enforces integrity before inserting payment (prevents negative amounts)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_validate_payment //
CREATE TRIGGER trg_validate_payment
BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    IF NEW.fee_paid < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Validation Error: fee_paid cannot be negative.';
    END IF;

    IF NEW.penalty_paid < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Validation Error: penalty_paid cannot be negative.';
    END IF;
END //

DELIMITER ;

