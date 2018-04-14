import { Component, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';

import { AuthenticationService } from '../../services/authentication.service';
import { NavigationService } from '../../services/navigation.service';
import { ActivationEnd } from '@angular/router';

@Component({
  selector: 'app-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss']
})
export class NavigationBarComponent implements OnInit {
  navigationBarWidth: number;
  burgerClass: string = 'burger-menu-inactive';
	authenticated: boolean = false;
	currentUrlPath: string = '';

  constructor(
		private authenticationService: AuthenticationService,
    private navigationService: NavigationService,
    private router: Router
  ) {
    this.navigationBarWidth = window.innerWidth;
  }

  ngOnInit() {
    this.authenticationService.get().then(v => {
      this.authenticated = (v.authorizationHeader ? true : false);
		}).catch(e => console.log('User not authenticated'));
		
		this.router.events.subscribe(e => {
			if (e instanceof ActivationEnd) {
				if (e.snapshot.url[0]) {
					this.currentUrlPath = e.snapshot.url[0].path;
				}
			}
		});

  }

  onResize(navigationBarHtmlElement: HTMLElement) {
    this.navigationBarWidth = navigationBarHtmlElement.clientWidth;
  }

  onBurgerMenu(routePath?: string): void {
    this.burgerClass = (this.burgerClass == 'burger-menu-inactive' ? '' : 'burger-menu-inactive');
    if (routePath) {
      this.navigationService.navigate(routePath);
    }
  }

  isSmallScreenSize(): boolean {
    let smallScreenSize = 400;
    if (this.navigationBarWidth < smallScreenSize) {
      return true;
    } else {
      return false;
    }
  }

  signText() {
    return (this.authenticated ? 'Sign-out' : 'Sign-in');
  }

  onMyAccount(): void {
    this.navigationService.navigate('/my-account');
  }

  onSign() {
    this.navigationService.navigate('/sign-in');
  }

  onTrades() {
    this.navigationService.navigate('/trade-list');
  }

  onMatchAndTrade() {
    this.navigationService.navigate('/welcome');
	}
	
	navbarTradesClass() {
		let result = '';
		if (this.currentUrlPath.startsWith('trade')) {
			result += ' active';
		}
		return result;
	}

	navbarMyAccountClass() {
		let result = '';
		if (this.currentUrlPath.startsWith('my-account')) {
			result += ' active';
		}
		return result;
	}

	navbarSignClass() {
		let result = '';
		if (this.currentUrlPath.startsWith('sign')) {
			result += ' active';
		}
		return result;
	}

}
