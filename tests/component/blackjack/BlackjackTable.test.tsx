import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlackjackTable } from '@/components/blackjack/BlackjackTable';
import { Card } from '@/lib/games/blackjack-cards';

/**
 * BlackjackTable Component Tests
 *
 * Tests for the Blackjack game table component that displays:
 * - Dealer's hand with optional hidden first card
 * - Player's hand
 * - Hand totals
 * - Special states (BLACKJACK, BUST)
 * - Divider between hands
 */

// Mock CardDisplay component
vi.mock('@/components/blackjack/CardDisplay', () => ({
  CardDisplay: ({ card, faceDown }: { card: Card | null; faceDown?: boolean }) => (
    <div data-testid="card-display" data-face-down={faceDown}>
      {faceDown ? 'BACK' : card ? `${card.display}${card.suit}` : 'HIDDEN'}
    </div>
  ),
}));

describe('BlackjackTable', () => {
  // Sample cards for testing
  const aceOfSpades: Card = { value: 1, suit: '♠', display: 'A' };
  const kingOfHearts: Card = { value: 13, suit: '♥', display: 'K' };
  const queenOfDiamonds: Card = { value: 12, suit: '♦', display: 'Q' };
  const tenOfClubs: Card = { value: 10, suit: '♣', display: '10' };
  const fiveOfHearts: Card = { value: 5, suit: '♥', display: '5' };
  const sixOfSpades: Card = { value: 6, suit: '♠', display: '6' };
  const sevenOfDiamonds: Card = { value: 7, suit: '♦', display: '7' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  test('should render the table container', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const table = container.querySelector('.bg-gradient-to-br');
    expect(table).toBeInTheDocument();
  });

  test('should have glassmorphic overlay', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const overlay = container.querySelector('.backdrop-blur-sm');
    expect(overlay).toBeInTheDocument();
  });

  test('should have yellow border styling', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const table = container.querySelector('.rounded-2xl');
    expect(table).toBeInTheDocument();
  });

  test('should show divider when both player and dealer have cards', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const divider = container.querySelector('.border-t-2');
    expect(divider).toBeInTheDocument();
  });

  test('should not show divider when player has no cards', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={0}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const divider = container.querySelector('.border-t-2');
    expect(divider).not.toBeInTheDocument();
  });

  test('should not show divider when dealer has no cards', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[]}
        playerTotal={21}
        dealerTotal={0}
        showDealerCard={true}
      />
    );

    const divider = container.querySelector('.border-t-2');
    expect(divider).not.toBeInTheDocument();
  });

  // ============================================================================
  // Dealer Hand Tests - Basic Rendering
  // ============================================================================

  test('should render "Dealer" heading', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    expect(screen.getByText('Dealer')).toBeInTheDocument();
  });

  test('should render dealer cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const cards = screen.getAllByTestId('card-display');
    // Should have 3 cards total (1 player + 2 dealer)
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  test('should show dealer total when showDealerCard is true', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    // Dealer total should be shown
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  test('should show "?" for dealer total when showDealerCard is false', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={false}
      />
    );

    // Dealer total should be hidden
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.queryByText('20')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Dealer Hand Tests - Hidden Card
  // ============================================================================

  test('should hide dealer first card when showDealerCard is false', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={false}
      />
    );

    const cards = screen.getAllByTestId('card-display');
    const dealerCards = Array.from(cards).slice(0, 2); // First 2 are dealer cards

    // First card should be face down
    expect(dealerCards[0]).toHaveAttribute('data-face-down', 'true');
    expect(dealerCards[0]).toHaveTextContent('BACK');
  });

  test('should show all dealer cards when showDealerCard is true', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const cards = screen.getAllByTestId('card-display');

    // No cards should be face down
    cards.forEach(card => {
      expect(card).not.toHaveAttribute('data-face-down', 'true');
    });
  });

  // ============================================================================
  // Dealer Hand Tests - Special States
  // ============================================================================

  test('should show "BLACKJACK!" when dealer has 21 with 2 cards and showDealerCard is true', () => {
    render(
      <BlackjackTable
        playerCards={[fiveOfHearts]}
        dealerCards={[aceOfSpades, kingOfHearts]}
        playerTotal={5}
        dealerTotal={21}
        showDealerCard={true}
      />
    );

    const blackjackTexts = screen.getAllByText('BLACKJACK!');
    expect(blackjackTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('should not show "BLACKJACK!" when dealer has 21 but showDealerCard is false', () => {
    render(
      <BlackjackTable
        playerCards={[fiveOfHearts]}
        dealerCards={[aceOfSpades, kingOfHearts]}
        playerTotal={5}
        dealerTotal={21}
        showDealerCard={false}
      />
    );

    // Should not show BLACKJACK because card is hidden
    expect(screen.queryByText('BLACKJACK!')).not.toBeInTheDocument();
  });

  test('should show "BUST!" when dealer total > 21 and showDealerCard is true', () => {
    render(
      <BlackjackTable
        playerCards={[fiveOfHearts]}
        dealerCards={[kingOfHearts, queenOfDiamonds, fiveOfHearts]}
        playerTotal={5}
        dealerTotal={25}
        showDealerCard={true}
      />
    );

    const bustTexts = screen.getAllByText('BUST!');
    expect(bustTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('should not show "BUST!" when dealer busts but showDealerCard is false', () => {
    render(
      <BlackjackTable
        playerCards={[fiveOfHearts]}
        dealerCards={[kingOfHearts, queenOfDiamonds, fiveOfHearts]}
        playerTotal={5}
        dealerTotal={25}
        showDealerCard={false}
      />
    );

    expect(screen.queryByText('BUST!')).not.toBeInTheDocument();
  });

  test('should not show dealer hand when no dealer cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[]}
        playerTotal={21}
        dealerTotal={0}
        showDealerCard={true}
      />
    );

    expect(screen.queryByText('Dealer')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Player Hand Tests - Basic Rendering
  // ============================================================================

  test('should render "Your Hand" heading', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    expect(screen.getByText('Your Hand')).toBeInTheDocument();
  });

  test('should render player cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds]}
        playerTotal={21}
        dealerTotal={10}
        showDealerCard={true}
      />
    );

    const cards = screen.getAllByTestId('card-display');
    // Should have 3 cards total (2 player + 1 dealer)
    expect(cards.length).toBe(3);
  });

  test('should show player total', () => {
    render(
      <BlackjackTable
        playerCards={[fiveOfHearts, sixOfSpades]}
        dealerCards={[queenOfDiamonds]}
        playerTotal={11}
        dealerTotal={10}
        showDealerCard={true}
      />
    );

    expect(screen.getByText('11')).toBeInTheDocument();
  });

  test('should not show player hand when no player cards', () => {
    render(
      <BlackjackTable
        playerCards={[]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={0}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    expect(screen.queryByText('Your Hand')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Player Hand Tests - Special States
  // ============================================================================

  test('should show "BLACKJACK!" when player has 21 with 2 cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    expect(screen.getByText('BLACKJACK!')).toBeInTheDocument();
  });

  test('should not show "BLACKJACK!" when player has 21 with more than 2 cards', () => {
    render(
      <BlackjackTable
        playerCards={[fiveOfHearts, sixOfSpades, tenOfClubs]}
        dealerCards={[queenOfDiamonds]}
        playerTotal={21}
        dealerTotal={10}
        showDealerCard={true}
      />
    );

    expect(screen.queryByText('BLACKJACK!')).not.toBeInTheDocument();
  });

  test('should show "BUST!" when player total > 21', () => {
    render(
      <BlackjackTable
        playerCards={[kingOfHearts, queenOfDiamonds, fiveOfHearts]}
        dealerCards={[tenOfClubs]}
        playerTotal={25}
        dealerTotal={10}
        showDealerCard={true}
      />
    );

    expect(screen.getByText('BUST!')).toBeInTheDocument();
  });

  test('should not show "BUST!" when player total <= 21', () => {
    render(
      <BlackjackTable
        playerCards={[kingOfHearts, tenOfClubs]}
        dealerCards={[queenOfDiamonds]}
        playerTotal={20}
        dealerTotal={10}
        showDealerCard={true}
      />
    );

    expect(screen.queryByText('BUST!')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Card Display Tests
  // ============================================================================

  test('should render correct number of player cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts, fiveOfHearts]}
        dealerCards={[]}
        playerTotal={16}
        dealerTotal={0}
        showDealerCard={true}
      />
    );

    const cards = screen.getAllByTestId('card-display');
    expect(cards.length).toBe(3);
  });

  test('should render correct number of dealer cards', () => {
    render(
      <BlackjackTable
        playerCards={[]}
        dealerCards={[queenOfDiamonds, tenOfClubs, fiveOfHearts]}
        playerTotal={0}
        dealerTotal={25}
        showDealerCard={true}
      />
    );

    const cards = screen.getAllByTestId('card-display');
    expect(cards.length).toBe(3);
  });

  test('should render correct total number of cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs, fiveOfHearts]}
        playerTotal={21}
        dealerTotal={25}
        showDealerCard={true}
      />
    );

    const cards = screen.getAllByTestId('card-display');
    // 2 player + 3 dealer = 5 total
    expect(cards.length).toBe(5);
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should handle empty card arrays', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[]}
        dealerCards={[]}
        playerTotal={0}
        dealerTotal={0}
        showDealerCard={true}
      />
    );

    expect(screen.queryByText('Your Hand')).not.toBeInTheDocument();
    expect(screen.queryByText('Dealer')).not.toBeInTheDocument();
    expect(container.querySelector('.border-t-2')).not.toBeInTheDocument();
  });

  test('should handle single player card', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    expect(screen.getByText('Your Hand')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  test('should handle single dealer card', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds]}
        playerTotal={21}
        dealerTotal={10}
        showDealerCard={true}
      />
    );

    expect(screen.getByText('Dealer')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('should handle many player cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, aceOfSpades, aceOfSpades, aceOfSpades, aceOfSpades]}
        dealerCards={[queenOfDiamonds]}
        playerTotal={15}
        dealerTotal={10}
        showDealerCard={true}
      />
    );

    const cards = screen.getAllByTestId('card-display');
    expect(cards.length).toBe(6); // 5 player + 1 dealer
  });

  test('should handle many dealer cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[fiveOfHearts, fiveOfHearts, fiveOfHearts, fiveOfHearts]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const cards = screen.getAllByTestId('card-display');
    expect(cards.length).toBe(5); // 1 player + 4 dealer
  });

  test('should toggle showDealerCard properly', () => {
    const { rerender } = render(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={false}
      />
    );

    // Initially hidden
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.queryByText('20')).not.toBeInTheDocument();

    // Show dealer card
    rerender(
      <BlackjackTable
        playerCards={[aceOfSpades]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={11}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    // Now shown
    expect(screen.queryByText('?')).not.toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  // ============================================================================
  // Both Players Blackjack
  // ============================================================================

  test('should show BLACKJACK for both player and dealer when both have 21 with 2 cards', () => {
    render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[aceOfSpades, queenOfDiamonds]}
        playerTotal={21}
        dealerTotal={21}
        showDealerCard={true}
      />
    );

    const blackjackTexts = screen.getAllByText('BLACKJACK!');
    expect(blackjackTexts.length).toBe(2); // One for player, one for dealer
  });

  // ============================================================================
  // Both Players Bust
  // ============================================================================

  test('should show BUST for both player and dealer when both bust', () => {
    render(
      <BlackjackTable
        playerCards={[kingOfHearts, queenOfDiamonds, fiveOfHearts]}
        dealerCards={[kingOfHearts, tenOfClubs, sixOfSpades]}
        playerTotal={25}
        dealerTotal={26}
        showDealerCard={true}
      />
    );

    const bustTexts = screen.getAllByText('BUST!');
    expect(bustTexts.length).toBe(2); // One for player, one for dealer
  });

  // ============================================================================
  // Layout and Styling Tests
  // ============================================================================

  test('should have relative z-10 on content wrapper', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const contentWrapper = container.querySelector('.relative.z-10');
    expect(contentWrapper).toBeInTheDocument();
  });

  test('should have min-height classes', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const table = container.querySelector('.min-h-\\[280px\\]');
    expect(table).toBeInTheDocument();
  });

  test('should have shadow-2xl class', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const table = container.querySelector('.shadow-2xl');
    expect(table).toBeInTheDocument();
  });

  test('should have overflow-hidden class', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[aceOfSpades, kingOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={21}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const table = container.querySelector('.overflow-hidden');
    expect(table).toBeInTheDocument();
  });

  // ============================================================================
  // Total Display Tests
  // ============================================================================

  test('should display player total with correct styling', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[fiveOfHearts, sixOfSpades]}
        dealerCards={[queenOfDiamonds]}
        playerTotal={11}
        dealerTotal={10}
        showDealerCard={true}
      />
    );

    const playerTotal = screen.getByText('11');
    expect(playerTotal).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
  });

  test('should display dealer total with correct styling when visible', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[fiveOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={5}
        dealerTotal={20}
        showDealerCard={true}
      />
    );

    const dealerTotal = screen.getByText('20');
    expect(dealerTotal).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
  });

  test('should display "?" with correct styling when dealer card hidden', () => {
    const { container } = render(
      <BlackjackTable
        playerCards={[fiveOfHearts]}
        dealerCards={[queenOfDiamonds, tenOfClubs]}
        playerTotal={5}
        dealerTotal={20}
        showDealerCard={false}
      />
    );

    const hiddenTotal = screen.getByText('?');
    expect(hiddenTotal).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
  });
});
