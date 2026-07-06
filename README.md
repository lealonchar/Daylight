# Daylight

Daylight е веб апликација за ученици 11-15 години која следи сон, screen time и расположение. Верзијата е поврзана со Firebase за акаунти и online чување на податоци.

## Што има

- Email/password login и регистрација преку Firebase Authentication.
- Режим „Разгледај без акаунт“ со демо податоци, без зачувување во Firebase.
- Firestore база за профил и дневни записи по корисник.
- Onboarding со повеќе цели: сон, screen time и расположение.
- Дневен внес за време на легнување, будење, screen time и расположение.
- 7/30 дневни трендови со графикон.
- Личен увид за врската помеѓу сон, screen time и расположение.
- Streak, поени и badges.
- Персонализирани микро совети.
- HBSC/WHO facts со извор.

## Firebase структура

```txt
users/{uid}/profile/main
users/{uid}/logs/{date}
```

## Firestore rules

Правилата се во `firestore.rules`. Тие дозволуваат корисник да чита и пишува само во својот `users/{uid}` простор.

## GitHub deploy

Во `.github/workflows/` има два workflow-и:

- `firebase-hosting-merge.yml` deploy-нува live верзија кога ќе има push на `main`.
- `firebase-hosting-pull-request.yml` прави preview deploy за pull request.

За да работат, во GitHub repo треба да има secret:

```txt
FIREBASE_SERVICE_ACCOUNT_DAYLIGHT_62AE6
```

Најлесно се додава преку Firebase CLI:

```bash
firebase init hosting:github
```

Кога CLI ќе праша дали да overwrite-не workflow files, избери `N`, бидејќи тие веќе се додадени.

## Пред да тестираш

1. Во Firebase Console вклучи Authentication -> Email/Password.
2. Во Firebase Console креирај Firestore Database.
3. Постави ги rules од `firestore.rules`.
4. Отвори ја апликацијата преку локален сервер или Firebase Hosting.

## Демо flow

1. Регистрирај нов акаунт.
2. Пополни го onboarding профилот и избери една или повеќе цели.
3. Внеси еден дневен запис.
4. Освежи ја страницата или најави се од друг browser со истиот акаунт.
5. Податоците треба повторно да се вчитаат од Firestore.

За брзо разгледување без акаунт, кликни „Разгледај без акаунт“. Во тој режим се прикажуваат пример податоци и ништо не се зачувува online.
