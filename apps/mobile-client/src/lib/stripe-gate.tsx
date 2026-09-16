import { type ReactElement } from 'react';
import { env } from '../config/env';

/**
 * Wraps the tree with StripeProvider only when a publishable key is set.
 * Avoids loading the native module in pure mock / Expo Go flows without key.
 */
export function StripeGate({
  children,
}: {
  children: ReactElement | ReactElement[];
}): ReactElement {
  if (!env.stripePublishableKey || env.useMocks) {
    return <>{children}</>;
  }

  // Lazy require so Metro can still resolve the package, but mock-only boots
  // never instantiate StripeProvider.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { StripeProvider } = require('@stripe/stripe-react-native') as {
    StripeProvider: (props: {
      publishableKey: string;
      children: ReactElement | ReactElement[];
    }) => ReactElement;
  };

  return (
    <StripeProvider publishableKey={env.stripePublishableKey}>{children}</StripeProvider>
  );
}
