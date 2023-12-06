import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchbarComponent } from './components/searchbar/searchbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NavbarComponent,
    SearchbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'recpiebook';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    // const testCollection = collection(this.firestore, 'recipes');
    // addDoc(testCollection, {
    // name: 'Citromos-Zsályás Csirkecombok',
    // likes: 10,
    // dislikes: 3,
    // imageUrl:
    //   'https://www.mindmegette.hu/images/390/XL/lead_XL_citromos-zsalyas-csirkecomb-recept.jpg',
    // cookTime: '75',
    // difficulty: 'medium',
    // price: 'normal',
    // quantity: '2',
    // ingredients: [
    //   '2db teljes csirkecomb',
    //   'olívaolaj',
    //   '15g húsos szalonna',
    //   '0.5fej vöröshagyma',
    //   '1gerezd fokhagyma',
    //   '1dl száraz fehérbor',
    //   '1db citrom leve',
    //   'só',
    //   'frissen őrölt bors',
    //   '1dl húsleves-alaplé',
    //   '5db zsályalevél',
    //   '1db tojássárgája',
    //   '0.5csok aprított petrezselyem',
    // ],
    // steps: [
    //   'Nyeles serpenyőben egy kevés olajon körbepirítjuk a csirkecombokat, majd kivesszük és félretesszük.',
    //   'Ugyanebben a serpenyőben lepirítjuk a kockára vágott szalonnát, majd a felaprított vörös,- és fokhagymát, felöntjük a borral és pároljuk pár percig, utána visszatesszük a húsokat.',
    //   'Meglocsoljuk fél citrom levével, megsózzuk, megborsozzuk, felöntjük az alaplével, és alacsony lángon, gyöngyözve, fedő alatt kb. 30 percig pároljuk.',
    //   'Ha a hús mindenhol átfőtt, ismét kivesszük a serpenyőből, a szószt hagyjuk még sűrűsödni pár percig, és az aprított zsályát is hozzáadjuk. Ezután elzárjuk alatta a tűzhelyet, és hűlni hagyjuk pár percig.',
    //   'Közben a tojást felverjük a maradék citromlével, adunk hozzá 1 merőkanálnyit a szószból, hőkiegyenlítés végett, és lassan, folyamatosan kevergetve a szószhoz csorgatjuk. Forralunk rajta egyet, közben egy picit rázogatjuk, nem keverjük.',
    //   'A csirkecombokat visszatesszük a szószba, átforgatjuk, és főtt rizzsel tálaljuk, aprított petrezselyemmel megszórjuk.',
    // ],
    // });
  }
}
