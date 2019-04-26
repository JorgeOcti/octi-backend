// declare module 'sweetalert' {
//   export interface SweetAlert {
//     (...params: any): Promise<any>;
// }
//   const _: any;
//   export = _;
// }

declare module 'sweetalert' {
  namespace Swal {
    export interface Settings {
      (...params: any): Promise<any>;
    }
  }

  // function SweetAlert(...params: any): Promise<any>;
  const swal: Swal.Settings;
  export = swal;
}
