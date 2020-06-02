import { Router } from '@angular/router';
import { WebrequestService } from './webrequest.service';
import { Injectable } from '@angular/core';
import { shareReplay, tap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private webService: WebrequestService, private router : Router) { }
//Login methods
  login(email : string, password : string){
    return this.webService.login(email, password).pipe(
      shareReplay(),
      tap((res : HttpResponse<any>) =>{
        //the auth tokens will be in the header of this response
        this.setSession(res.body._id, res.headers.get('x-access-token'), res.headers.get('x-refresh-token') )
        console.log("Logged in!");
        })
    )
  }

  private setSession(userId : string, accessToken : string, refreshToken : string){
    localStorage.setItem('user-id', userId);
    localStorage.setItem('access-token', accessToken);
    localStorage.setItem('refresh-token', refreshToken);
  }

  getAccessToken() {
    return localStorage.getItem('x-access-item');
  }

  getRefreshToken() {
    return localStorage.getItem('x-refresh-item');
  }


  setAccessToken(accessToken) {
    localStorage.setItem('x-access-token', accessToken)
  }

  //logout
  logout(){
    this.removeSession();
  }

  private removeSession() {
    localStorage.removeItem('user-id');
    localStorage.removeItem('access-token');
    localStorage.removeItem('refresh-token');
  }



}
