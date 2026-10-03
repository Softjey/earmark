use anchor_lang::prelude::*;

#[error_code]
pub enum EarmarkError {
    #[msg("Recipient is not a verified, active clinic")]
    RecipientNotVerified,
    #[msg("This quote has already been used for another fundraiser")]
    QuoteAlreadyUsed,
    #[msg("Target must be greater than zero")]
    InvalidTarget,
    #[msg("Deadline must be in the future")]
    DeadlineInPast,
    #[msg("Fundraiser is not pending confirmation")]
    NotPending,
    #[msg("Fundraiser is not active")]
    NotActive,
    #[msg("Fundraiser deadline has passed")]
    DeadlinePassed,
    #[msg("Fundraiser is not refundable")]
    NotRefundable,
    #[msg("Donation was already refunded")]
    AlreadyRefunded,
    #[msg("Signer is not authorized for this action")]
    Unauthorized,
    #[msg("A text field is too long")]
    FieldTooLong,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Fundraiser can no longer be cancelled")]
    NotCancellable,
}
