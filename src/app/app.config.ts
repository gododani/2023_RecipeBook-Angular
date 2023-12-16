import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { AngularFireModule } from '@angular/fire/compat';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(AngularFireModule.initializeApp({
        projectId: 'webfejl-2023-recept',
        appId: '1:550549916932:web:f6bafe4a6e2dc36e895451',
        storageBucket: 'webfejl-2023-recept.appspot.com',
        apiKey: 'AIzaSyBchTaka77o_sW-ZpKKoGhQnVQ4qfTj8Jo',
        authDomain: 'webfejl-2023-recept.firebaseapp.com',
        messagingSenderId: '550549916932',
        measurementId: 'G-SDM55KBZPZ',
    }), provideFirebaseApp(() => initializeApp({
        projectId: 'webfejl-2023-recept',
        appId: '1:550549916932:web:f6bafe4a6e2dc36e895451',
        storageBucket: 'webfejl-2023-recept.appspot.com',
        apiKey: 'AIzaSyBchTaka77o_sW-ZpKKoGhQnVQ4qfTj8Jo',
        authDomain: 'webfejl-2023-recept.firebaseapp.com',
        messagingSenderId: '550549916932',
        measurementId: 'G-SDM55KBZPZ',
    }))),
    importProvidersFrom(provideAuth(() => getAuth())),
    importProvidersFrom(provideFirestore(() => getFirestore())),
    importProvidersFrom(provideStorage(() => getStorage())),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
],
};
