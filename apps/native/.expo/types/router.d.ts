/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}${'/(tabs)'}/two` | `/two`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}${'/(tabs)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}${'/(tabs)'}/two` | `/two`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}${'/(tabs)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}${'/(tabs)'}/two${`?${string}` | `#${string}` | ''}` | `/two${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}${'/(tabs)'}/two` | `/two`; params?: Router.UnknownInputParams; };
    }
  }
}
