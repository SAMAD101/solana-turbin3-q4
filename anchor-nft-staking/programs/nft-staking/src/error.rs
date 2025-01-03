use anchor_lang::prelude::*;

#[error_code]
pub enum StakeError {
    #[msg("maximum stake reached")]
    MaxStakeReached,
    #[msg("freeze period not reached")]
    FreezePeriodNotPassed,
}
