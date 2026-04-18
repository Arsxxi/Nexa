declare module '@convex/_generated/api' {
  export const api: any;
}

declare module 'convex/_generated/api' {
  export const api: any;
}

declare module 'convex' {
  export function useQuery<Args, Output>(query: any, args?: Args): Output;
  export function useMutation<Args, Output>(mutation: any, args?: Args): (args: Args) => Promise<Output>;
  export function useAction<Args, Output>(action: any, args?: Args): (args: Args) => Promise<Output>;
}

declare module '@convex/react' {
  export function useQuery<Args, Output>(query: any, args?: Args): Output;
  export function useMutation<Args, Output>(mutation: any, args?: Args): (args: Args) => Promise<Output>;
  export function useAction<Args, Output>(action: any, args?: Args): (args: Args) => Promise<Output>;
  export class ConvexProviderWithClerk<Props> {
    constructor(props: Props);
  }
  export class ConvexReactClient {
    constructor(args: { address: string });
  }
}