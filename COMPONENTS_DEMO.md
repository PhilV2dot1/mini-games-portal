# UI Components Library - Documentation & Examples

## 📚 Vue d'Ensemble

Le Design System de Celo Games Portal comprend :

### ✅ Composants Créés

1. **Design Tokens** - Tokens de design centralisés
2. **Motion Utilities** - Utilitaires d'animation avec support reduced motion
3. **Button** - Bouton avec 6 variants et 3 tailles
4. **Card** - Carte conteneur avec 4 variants
5. **Input** - Input de formulaire avec états et validation
6. **Modal** - Modal accessible avec focus trap
7. **Badge** - Badge pour statuts et labels
8. **Skeleton** - Placeholders de chargement

---

## 🎨 Design Tokens

### Localisation
`lib/constants/design-tokens.ts`

### Utilisation

```typescript
import { colors, shadows, animations } from '@/lib/constants/design-tokens';

// Couleurs
const celoYellow = colors.celo; // '#FCFF52'
const gameGradient = colors.game.connectfive; // { from: '#3b82f6', to: '#6366f1' }

// Shadows avec Celo glow
const celoShadow = shadows.celoXl; // '0 0 0 6px #FCFF52, ...'

// Animations (Framer Motion variants)
const fadeIn = animations.fadeIn;
```

### Fonctions Utilitaires

```typescript
import { getGameGradient, getCeloShadow } from '@/lib/constants/design-tokens';

// Obtenir gradient CSS pour un jeu
const gradient = getGameGradient('connectfive');

// Obtenir shadow avec glow
const shadow = getCeloShadow('xl');
```

---

## 🎬 Motion Utilities

### Localisation
`lib/utils/motion.ts`

### Hooks

```typescript
import { useReducedMotion, useShouldAnimate } from '@/lib/utils/motion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = useShouldAnimate(); // Inclut détection Farcaster

  return (
    <motion.div
      animate={shouldAnimate ? { scale: 1.05 } : {}}
    >
      Content
    </motion.div>
  );
}
```

### Variants Prédéfinis

```typescript
import {
  fadeInVariants,
  slideUpVariants,
  modalVariants,
  backdropVariants,
  tileSpawnVariants,
} from '@/lib/utils/motion';

<motion.div variants={fadeInVariants} initial="initial" animate="animate">
  Fade in content
</motion.div>
```

---

## 🔘 Button Component

### Import

```typescript
import { Button } from '@/components/ui';
// ou
import { Button } from '@/components/ui/Button';
```

### Variants

```tsx
// Primary (default)
<Button variant="primary">Primary Button</Button>

// Secondary
<Button variant="secondary">Secondary</Button>

// Celo (jaune avec gradient)
<Button variant="celo">Play Now</Button>

// Ghost (transparent)
<Button variant="ghost">Ghost</Button>

// Outline
<Button variant="outline">Outline</Button>

// Danger
<Button variant="danger">Delete</Button>
```

### Tailles

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
```

### États

```tsx
// Loading
<Button loading>Loading...</Button>

// Disabled
<Button disabled>Disabled</Button>

// Full Width
<Button fullWidth>Full Width Button</Button>
```

### Avec Icons

```tsx
<Button leftIcon={<span>📧</span>}>
  Send Email
</Button>

<Button rightIcon={<span>→</span>}>
  Next
</Button>

<Button
  leftIcon={<span>⭐</span>}
  rightIcon={<span>→</span>}
>
  Star & Continue
</Button>
```

### Accessibilité

```tsx
<Button ariaLabel="Close modal">
  ×
</Button>
```

### Props Complètes

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'celo' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  disableAnimation?: boolean;
  ariaLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

---

## 🎴 Card Component

### Import

```typescript
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';
```

### Variants

```tsx
// Default
<Card variant="default">
  Default card
</Card>

// Elevated (plus de shadow)
<Card variant="elevated">
  Elevated card
</Card>

// Outlined
<Card variant="outlined">
  Outlined card
</Card>

// Glass (glassmorphism)
<Card variant="glass">
  Glass card with blur
</Card>
```

### Avec Padding

```tsx
<Card padding="none">No padding</Card>
<Card padding="sm">Small padding</Card>
<Card padding="md">Medium padding (default)</Card>
<Card padding="lg">Large padding</Card>
```

### Avec Hover Effect

```tsx
<Card hover>
  Hover me! (scale + shadow)
</Card>
```

### Avec Sub-Components

```tsx
<Card>
  <CardHeader>
    <h2>Game Title</h2>
  </CardHeader>

  <CardBody>
    <p>Game description and content</p>
  </CardBody>

  <CardFooter>
    <Button>Play Now</Button>
  </CardFooter>
</Card>
```

### Card Interactive

```tsx
<Card onClick={() => console.log('clicked')} hover>
  Click me! (accessible via keyboard)
</Card>
```

---

## 📝 Input Component

### Import

```typescript
import { Input } from '@/components/ui';
```

### Basique

```tsx
<Input
  label="Username"
  placeholder="Enter your username"
  type="text"
/>
```

### Avec États

```tsx
// Error state
<Input
  label="Email"
  error="Invalid email format"
  type="email"
/>

// Success state
<Input
  label="Password"
  state="success"
  type="password"
/>
```

### Avec Icons

```tsx
<Input
  label="Search"
  leftIcon={<span>🔍</span>}
  placeholder="Search games..."
/>

<Input
  label="Email"
  rightIcon={<span>📧</span>}
  type="email"
/>
```

### Tailles

```tsx
<Input size="sm" placeholder="Small" />
<Input size="md" placeholder="Medium (default)" />
<Input size="lg" placeholder="Large" />
```

### Avec Hint

```tsx
<Input
  label="Password"
  hint="Must be at least 8 characters"
  type="password"
/>
```

### Full Width

```tsx
<Input
  label="Full Width Input"
  fullWidth
  placeholder="Takes full container width"
/>
```

### Props Complètes

```typescript
interface InputProps {
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'error' | 'success';
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
}
```

---

## 🪟 Modal Component

### Import

```typescript
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
```

### Basique

```tsx
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        description="Modal description text"
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### Avec Sub-Components

```tsx
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <ModalHeader>
    <h2>Custom Header</h2>
  </ModalHeader>

  <ModalBody>
    <p>Custom body content</p>
  </ModalBody>

  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="celo" onClick={handleSubmit}>
      Submit
    </Button>
  </ModalFooter>
</Modal>
```

### Tailles

```tsx
<Modal size="sm" {...props}>Small modal</Modal>
<Modal size="md" {...props}>Medium (default)</Modal>
<Modal size="lg" {...props}>Large modal</Modal>
<Modal size="xl" {...props}>Extra large</Modal>
```

### Options

```tsx
// Sans bouton de fermeture
<Modal showCloseButton={false} {...props}>
  Content
</Modal>

// Ne pas fermer au clic sur backdrop
<Modal closeOnBackdropClick={false} {...props}>
  Content
</Modal>

// Sans animations
<Modal disableAnimation {...props}>
  Content
</Modal>
```

### Caractéristiques

- ✅ Portal rendering (rendu hors du DOM parent)
- ✅ Focus trap (navigation clavier piégée dans modal)
- ✅ Escape key to close
- ✅ Body scroll lock
- ✅ Backdrop blur
- ✅ Celo glow shadow
- ✅ Fully accessible (ARIA compliant)

---

## 🏷️ Badge Component

### Import

```typescript
import { Badge } from '@/components/ui';
```

### Variants

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="celo">Celo</Badge>
```

### Tailles

```tsx
<Badge size="sm">Small</Badge>
<Badge size="md">Medium (default)</Badge>
<Badge size="lg">Large</Badge>
```

### Avec Icon

```tsx
<Badge icon={<span>⭐</span>}>
  Featured
</Badge>
```

### Avec Status Dot

```tsx
<Badge variant="success" dot>
  Online
</Badge>

<Badge variant="error" dot>
  Offline
</Badge>
```

### Exemples d'Utilisation

```tsx
// Game fee indicator
<Badge variant="warning" icon={<span>💰</span>}>
  0.01 CELO
</Badge>

// New game badge
<Badge variant="celo">NEW</Badge>

// Player status
<Badge variant="success" dot size="sm">
  Active
</Badge>
```

---

## 💀 Skeleton Components

### Import

```typescript
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonCardGrid,
} from '@/components/ui';
```

### Skeleton de Base

```tsx
// Basique
<Skeleton width={200} height={20} />

// Circle (avatar)
<Skeleton circle width={48} height={48} />

// Sans animation (reduced motion)
<Skeleton disableAnimation width={100} height={30} />
```

### Skeleton Text

```tsx
// 3 lignes par défaut
<SkeletonText />

// Custom nombre de lignes
<SkeletonText lines={5} />
```

### Skeleton Prédéfinis

```tsx
// Avatar
<SkeletonAvatar size={64} />

// Button
<SkeletonButton width={120} height={40} />
```

### Skeleton Card

```tsx
// Une seule card
<SkeletonCard />

// Multiple cards
<SkeletonCard count={3} />

// Compact variant
<SkeletonCardCompact count={4} />

// Grid layout (comme game grid)
<SkeletonCardGrid count={6} />
```

### Exemple d'Utilisation Réelle

```tsx
function GameGrid() {
  const { games, isLoading } = useGames();

  if (isLoading) {
    return <SkeletonCardGrid count={6} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map(game => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
```

---

## 📦 Import depuis Index

Tous les composants peuvent être importés depuis un seul endroit :

```typescript
import {
  Button,
  Card, CardHeader, CardBody, CardFooter,
  Input,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Badge,
  Skeleton, SkeletonText, SkeletonCard,
} from '@/components/ui';
```

---

## 🎯 Exemples Complets

### Example 1 : Login Modal

```tsx
import { useState } from 'react';
import { Modal, ModalFooter, Input, Button } from '@/components/ui';

function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Login logic
  };

  return (
    <>
      <Button variant="celo" onClick={() => setIsOpen(true)}>
        Login
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Welcome Back"
        description="Login to continue playing"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<span>📧</span>}
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<span>🔒</span>}
            error={error}
            fullWidth
          />
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="celo" onClick={handleLogin}>
            Login
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

### Example 2 : Game Card avec Loading State

```tsx
import { Card, CardBody, CardFooter, Button, Badge, SkeletonCard } from '@/components/ui';

function GameCard({ game, isLoading }) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  return (
    <Card variant="elevated" hover padding="lg">
      <CardBody>
        {/* Game Icon */}
        <div className="text-6xl text-center mb-4">
          {game.icon}
        </div>

        {/* Game Title */}
        <h3 className="text-2xl font-black text-center mb-2">
          {game.name}
        </h3>

        {/* Badges */}
        <div className="flex gap-2 justify-center mb-3">
          {game.isNew && <Badge variant="celo">NEW</Badge>}
          {game.hasFee && (
            <Badge variant="warning" icon={<span>💰</span>}>
              0.01 CELO
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-center text-sm mb-4">
          {game.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div>
            <div className="text-lg font-bold">{game.played}</div>
            <div className="text-xs text-gray-600">Played</div>
          </div>
          <div>
            <div className="text-lg font-bold">{game.wins}</div>
            <div className="text-xs text-gray-600">Wins</div>
          </div>
          <div>
            <div className="text-lg font-bold">{game.points}</div>
            <div className="text-xs text-gray-600">Points</div>
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <Button variant="celo" fullWidth>
          Play Now
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Example 3 : Form avec Validation

```tsx
import { useState } from 'react';
import { Input, Button } from '@/components/ui';

function ProfileForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!username || username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    // Submit logic
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Username"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={errors.username}
        hint="3-20 characters, alphanumeric"
        leftIcon={<span>👤</span>}
        fullWidth
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        leftIcon={<span>📧</span>}
        fullWidth
        required
      />

      <Button
        type="submit"
        variant="celo"
        fullWidth
        loading={isLoading}
      >
        Save Profile
      </Button>
    </form>
  );
}
```

---

## ♿ Accessibilité

Tous les composants sont **WCAG 2.1 compliant** :

- ✅ ARIA labels et roles appropriés
- ✅ Navigation clavier complète
- ✅ Focus indicators visibles
- ✅ Screen reader friendly
- ✅ Reduced motion support
- ✅ Color contrast ratios > 4.5:1
- ✅ Error announcements (aria-live)
- ✅ Focus trap dans modals

---

## 🎨 Theming

### Utiliser les Design Tokens

```tsx
import { colors, shadows } from '@/lib/constants/design-tokens';

<div
  style={{
    backgroundColor: colors.celo,
    boxShadow: shadows.celoXl,
  }}
>
  Themed content
</div>
```

### Tailwind Classes

Les composants utilisent Tailwind CSS. Vous pouvez surcharger avec `className` :

```tsx
<Button className="my-custom-class hover:scale-110">
  Custom styled button
</Button>
```

---

## 🧪 Testing

Tous les composants incluent des tests complets :

- Unit tests (Vitest)
- Accessibility tests
- Interaction tests
- Variant tests

Voir `tests/unit/ui/Button.test.tsx` pour exemple.

---

## 📝 Notes Importantes

1. **Reduced Motion** : Tous les composants respectent `prefers-reduced-motion`
2. **Farcaster Detection** : Animations désactivées automatiquement dans Farcaster
3. **SSR Safe** : Tous les composants sont compatibles Next.js SSR
4. **TypeScript** : Types complets pour IntelliSense
5. **Performance** : Memoization et lazy loading intégrés

---

**Fin de la Documentation**

Pour plus d'exemples, consultez les composants existants dans `components/games/` et `components/auth/`.
