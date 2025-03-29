use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::metadata::{
    Metadata as MetadataAccount,
};
use anchor_lang::solana_program::{
    program::invoke,
    system_instruction,
};

declare_id!("DvjN1y25fbfFqhXGwnWSTSd6q2Zq8n5inPVoJtT6MHTv");

#[program]
pub mod nft_showcase {
    use super::*;

    // List an NFT on the marketplace
    pub fn list_nft(
        ctx: Context<ListNFT>,
        price: u64,
        nft_name: String,
        nft_symbol: Option<String>,
        nft_uri: String,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let seller = &ctx.accounts.seller;
        
        listing.seller = seller.key();
        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        listing.nft_name = nft_name;
        listing.nft_symbol = nft_symbol.unwrap_or_default();
        listing.nft_uri = nft_uri;
        listing.is_active = true;
        
        // Transfer NFT to PDA escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_nft_account.to_account_info(),
            to: ctx.accounts.escrow_nft_account.to_account_info(),
            authority: seller.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, 1)?;
        
        emit!(ListingCreatedEvent {
            listing_id: listing.key(),
            seller: seller.key(),
            nft_mint: ctx.accounts.nft_mint.key(),
            price,
        });
        
        Ok(())
    }
    
    // Purchase an NFT from the marketplace
    pub fn buy_nft(ctx: Context<BuyNFT>) -> Result<()> {
        require!(ctx.accounts.listing.is_active, NftMarketplaceError::ListingNotActive);
        
        let buyer = &ctx.accounts.buyer;
        let seller = ctx.accounts.listing.seller;
        let price = ctx.accounts.listing.price;
        let nft_mint = ctx.accounts.listing.nft_mint;
        let listing_pubkey = ctx.accounts.listing.key();
        
        // Transfer SOL from buyer to seller
        invoke(
            &system_instruction::transfer(
                &buyer.key(),
                &seller,
                price,
            ),
            &[
                buyer.to_account_info(),
                ctx.accounts.seller_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        
        // Transfer NFT from escrow to buyer
        let seeds = &[
            b"listing".as_ref(),
            nft_mint.as_ref(),
            &[ctx.bumps.listing],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_nft_account.to_account_info(),
            to: ctx.accounts.buyer_nft_account.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, 1)?;
        
        // Mark listing as inactive
        ctx.accounts.listing.is_active = false;
        
        emit!(NftPurchasedEvent {
            listing_id: listing_pubkey,
            buyer: buyer.key(),
            seller,
            nft_mint,
            price,
        });
        
        Ok(())
    }
    
    // Cancel an NFT listing and return it to the seller
    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        require!(ctx.accounts.listing.is_active, NftMarketplaceError::ListingNotActive);
        
        let seller = &ctx.accounts.seller;
        let listing_seller = ctx.accounts.listing.seller;
        let nft_mint = ctx.accounts.listing.nft_mint;
        let listing_pubkey = ctx.accounts.listing.key();
        
        require!(listing_seller == seller.key(), NftMarketplaceError::UnauthorizedAccess);
        
        // Transfer NFT from escrow back to seller
        let seeds = &[
            b"listing".as_ref(),
            nft_mint.as_ref(),
            &[ctx.bumps.listing],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_nft_account.to_account_info(),
            to: ctx.accounts.seller_nft_account.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, 1)?;
        
        // Mark listing as inactive
        ctx.accounts.listing.is_active = false;
        
        emit!(ListingCanceledEvent {
            listing_id: listing_pubkey,
            seller: seller.key(),
            nft_mint,
        });
        
        Ok(())
    }
}

// Account structure to store listing information
#[account]
pub struct NftListing {
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub nft_name: String,
    pub nft_symbol: String,
    pub nft_uri: String,
    pub is_active: bool,
}

// Context for the list_nft instruction
#[derive(Accounts)]
pub struct ListNFT<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    pub nft_mint: Account<'info, token::Mint>,
    
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = seller,
    )]
    pub seller_nft_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = nft_mint,
        associated_token::authority = listing,
    )]
    pub escrow_nft_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 32 + 8 + 100 + 10 + 200 + 1, // Estimated space for the listing
        seeds = [b"listing".as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, NftListing>,
    
    pub metadata_program: Program<'info, MetadataAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Context for the buy_nft instruction
#[derive(Accounts)]
pub struct BuyNFT<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"listing".as_ref(), listing.nft_mint.as_ref()],
        bump,
        constraint = listing.is_active @ NftMarketplaceError::ListingNotActive
    )]
    pub listing: Account<'info, NftListing>,
    
    /// CHECK: This is the seller's wallet, verified in the listing
    #[account(mut, address = listing.seller @ NftMarketplaceError::UnauthorizedAccess)]
    pub seller_wallet: AccountInfo<'info>,
    
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = listing,
    )]
    pub escrow_nft_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = nft_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_nft_account: Account<'info, TokenAccount>,
    
    #[account(address = listing.nft_mint)]
    pub nft_mint: Account<'info, token::Mint>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Context for the cancel_listing instruction
#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"listing".as_ref(), listing.nft_mint.as_ref()],
        bump,
        constraint = listing.is_active @ NftMarketplaceError::ListingNotActive,
        constraint = listing.seller == seller.key() @ NftMarketplaceError::UnauthorizedAccess
    )]
    pub listing: Account<'info, NftListing>,
    
    #[account(address = listing.nft_mint)]
    pub nft_mint: Account<'info, token::Mint>,
    
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = listing,
    )]
    pub escrow_nft_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = nft_mint,
        associated_token::authority = seller,
    )]
    pub seller_nft_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Custom error codes
#[error_code]
pub enum NftMarketplaceError {
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
}

// Events
#[event]
pub struct ListingCreatedEvent {
    pub listing_id: Pubkey,
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
}

#[event]
pub struct NftPurchasedEvent {
    pub listing_id: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
}

#[event]
pub struct ListingCanceledEvent {
    pub listing_id: Pubkey,
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
}
