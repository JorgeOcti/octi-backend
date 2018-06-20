declare module 'is-uuid' {

  export function v1(uuid: string): boolean;
  export function v2(uuid: string): boolean;
  export function v3(uuid: string): boolean;
  export function v4(uuid: string): boolean;
  export function v5(uuid: string): boolean;
  export function anyNonNil(uuid: string): boolean;
  export function nil(uuid: string): boolean;
}
