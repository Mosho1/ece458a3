import { observable, action, runInAction, computed } from 'mobx';
import { Login } from '../components/Login';
import { Search } from '../components/Search';
import { Add } from '../components/Add';
import { encrypt, decrypt } from '../../webpack/crypto';


window['encrypt'] = encrypt;
window['decrypt'] = decrypt;

export interface Site {
  id: number,
  site: string;
  site_username: string;
  site_password: string;
}

/*
* This is the entry point for the app's state. All stores should go here.
*/
export class AppState {
  @observable login: Login = null;
  @observable search: Search = null;
  @observable add: Add = null;
  @observable loggedInAs: string | null = null;
  @observable masterKey: string | null = null;
  @observable searchTerm = '';
  @observable searchResults: Site[] | null = null;

  resetState() {
    this.loggedInAs = null;
    this.masterKey = null;
    this.searchResults = null;
  }

  setSearchTerm(value: string) {
    this.searchTerm = value;
  }

  @computed get encrypt() {
    return encrypt(this.masterKey);
  }

  @computed get decrypt() {
    return decrypt(this.masterKey);
  }

  async searchForSites() {
    this.searchResults = null;
    this.goTo('/search');
    const res = await this.apiRequest(`/passwords/search?site=${this.searchTerm}`);
    const encryptedResults = await res.json() as Site[];
    this.searchResults = encryptedResults.map(x => ({
      id: x.id,
      site: x.site,
      site_username: this.decrypt(x.site_username),
      site_password: this.decrypt(x.site_password),
    }))
  }

  async refreshToken() {
    try {
      const res = await this.apiRequest('refresh', {
        method: 'POST'
      });

      const user = await res.json();

      runInAction(() => {
        this.loggedInAs = user.username;
      });
    } catch (e) {
      console.error(e);
    }
  }

  goTo = (url: string, replace = false) =>
    replace
      ? history.replaceState(null, "", url)
      : history.pushState(null, "", url)

  apiRequest = async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/${path.replace(/^\//, '')}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      ...init,
    });

    if (res.status !== 200) {
      throw new Error(res.statusText);
    }

    return res;
  }

  @action
  reload(store?: AppState) {
    if (store) {
      Object.assign(this, store);
    }
    return this;
  }

  unload() {

  }
}

export default AppState;