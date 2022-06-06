import { IUser } from '../../../../../src/app/interfaces/user.interface';
import { IWindow } from '../interfaces/window';
import * as queryString from 'query-string';

declare let window: IWindow;

export function parseReplicableURL(url: string): string {
  let query = queryString.parse(window.location.search);
  const hastQueryURL = url.split('?');
  if (hastQueryURL.length > 1) {
    let text = window.location.search;
    if (window.location.search) {
      if (text?.length) {
        text = `${text}&${hastQueryURL[hastQueryURL.length - 1]}`;
      } else {
        text = `?${hastQueryURL[hastQueryURL.length - 1]}`;
      }
    } else {
      text = `?${hastQueryURL[hastQueryURL.length - 1]}`;
    }
    query = queryString.parse(text);
  }
  /* process here actions by parameters in query param */
  return `${url.split('?')[0]}?${queryString.stringify(query)}`;
}

export function getExtension(name: string): string {
  const descomposition = name.split('.');
  if (descomposition.length) {
    return descomposition[descomposition.length - 1].toLowerCase();
  }
  return '';
}

export function getIconFromExtension(extension: string): string {
  // https://en.wikipedia.org/wiki/List_of_Microsoft_Office_filename_extensions
  const word = ['doc', 'docx', 'docm', 'dotx'];
  const excel = ['xls', 'xlsx', 'xlsm', 'xltx', 'csv'];
  const pdf = ['pdf'];
  const image = ['jpeg', 'gif', 'jpg', 'png'];
  extension = extension.toLowerCase();
  if (word.includes(extension)) {
    return 'word';
  } else if (excel.includes(extension)) {
    return 'excel';
  } else if (pdf.includes(extension)) {
    return 'pdf';
  } else if (image.includes(extension)) {
    return extension;
  } else {
    return 'file';
  }
}

export function getDistFromBottom(): number {
  const scrollPosition: number = window.pageYOffset;
  const windowSize: number = window.innerHeight;
  const bodyHeight: number = document.body.offsetHeight;

  return Math.max(bodyHeight - (scrollPosition + windowSize), 0);
}

export function maxText(text: string, max: number): string {
  if (text && text.length > max) {
    return `${text.slice(0, max)}...`;
  }
  return text;
}

export function updateTooltip() {
  $('[data-toggle="tooltip"]').tooltip();
}

interface IMixpanelProps {
  [index: string]: any;
}

export function statusFooterButttonsModal(status: boolean) {
  $('.modal-footer button').attr({
    disabled: status
  });
}

export function showModal(show: boolean) {
  ($('#andesModal') as any).modal(show ? 'show' : 'hide');
}

export function goToSection(id: string) {
  const $id = $(id);
  const distance = ($id as any).offset().top - ($('.main-header') as any).height() - 50;
  if ($id && $id.length) {
    $('html, body').stop().animate({
      scrollTop: distance
    }, 500);
  }
}

export function reactTrackMixpanel(event: string, props: IMixpanelProps): void {
  if (typeof (window.mixpanel) === 'object') {
    mixpanel.register({
      // team: window.user.teamName,
      // team_id: window.user.teamID,
      // role: window.user.roleID,
      // role_id: window.user.roleName,
      // venue: window.user.venueName,
      // venue_id: window.user.venueID,
      // department: window.user.departmentName,
      // department_id: window.user.departmentID
    });
    mixpanel.identify(window.user._id);
    mixpanel.people.set({
      // $first_name: window.user.first_name,
      // $last_name: window.user.last_name,
      // $email: window.user.email,
      // team: window.user.teamName,
      // team_id: window.user.teamID,
      // role: window.user.roleID,
      // role_id: window.user.roleName,
      // venue: window.user.venueName,
      // venue_id: window.user.venueID,
      // department: window.user.departmentName,
      // department_id: window.user.departmentID
    });
    window.mixpanel.track(event, props);
  }
}

// https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery
export function isIntenertExplorer() {
  const ua = window.navigator.userAgent;

  const msie = ua.indexOf('MSIE ');
  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }

  const trident = ua.indexOf('Trident/');
  if (trident > 0) {
    // IE 11 => return version number
    const rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }

  const edge = ua.indexOf('Edge/');
  if (edge > 0) {
    // Edge (IE 12+) => return version number
    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }
  // other browser
  return false;
}

export function hasPermission(user: IUser, permission: string) {
  if (window.user && window.user.userPermissions && window.user.userPermissions.length && permission && permission.length) {
    return window.user.userPermissions.some((p) => p.codeName === permission);
  }
  return false;
}

export function isDercoDercocenter(object?: any) {
  let user: IUser = window.user;
  const dercocenterID = '5c1a80f84fba86565186a757';
  return object && object.hasOwnProperty('company') ?
    object.company === dercocenterID : user.company._id === dercocenterID;
}

export const disabledTView = false;
