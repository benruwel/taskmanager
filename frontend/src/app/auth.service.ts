import { Router } from '@angular/router';
import { WebrequestService } from './webrequest.service';
import { Injectable } from '@angular/core';
import { shareReplay, tap } from 'rxjs/operators';
import { HttpResponse, HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private webService: WebrequestService, private router : Router, private http : HttpClient) { }
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

  signup(email : string, password : string){
    return this.webService.signup(email, password).pipe(
      shareReplay(),
      tap((res : HttpResponse<any>) =>{
        //the auth tokens will be in the header of this response
        this.setSession(res.body._id, res.headers.get('x-access-token'), res.headers.get('x-refresh-token') )
        console.log("Signed up and logged in!");
        })
    )
  }
  
  private setSession(userId : string, accessToken : string, refreshToken : string){
    localStorage.setItem('user-id', userId);
    localStorage.setItem('x-access-token', accessToken);
    localStorage.setItem('x-refresh-token', refreshToken);
  }

  getAccessToken() {
    return localStorage.getItem('x-access-token');
  }

  getRefreshToken() {
    return localStorage.getItem('x-refresh-token');
  }

  getUserId () {
    return localStorage.getItem('user-id');
  }

  setAccessToken(accessToken) {
    localStorage.setItem('x-access-token', accessToken)
  }

  //logout
  logout(){
    this.removeSession();

    this.router.navigateByUrl('/login');

  }

  private removeSession() {
    localStorage.removeItem('user-id');
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('x-refresh-token');
  }

  getNewAccessToken() {
    return this.http.get(`${this.webService.ROOT_URL}/users/me/access-token`, {
      headers: {
        'x-refresh-token': this.getRefreshToken(),
        '_id': this.getUserId()
      },
      observe: 'response'
    }).pipe(
      tap((res: HttpResponse<any>) => {
        this.setAccessToken(res.headers.get('x-access-token'));
      })
    )
  }


}
