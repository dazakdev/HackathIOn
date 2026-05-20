Dokumentacja Funkcjonalna Aplikacji Edukacyjnej

Aplikacja to innowacyjna platforma edukacyjna łącząca naukę z elementami grywalizacji (RPG). Proces korzystania z programu podzielony jest na cztery główne fazy, które prowadzą użytkownika od przyswojenia tekstu źródłowego, aż po finałową walkę z „bossem”.

---

## 1. Faza Początkowa: Pulpit Nawigacyjny i Konfiguracja

### Pulpit Nawigacyjny (Dashboard)
Po zalogowaniu użytkownik trafia na stronę główną, która pełni rolę centrum dowodzenia:
* **Aktywne Sesje:** Lista wcześniej rozpoczętych sesji, do których można wrócić w dowolnym momencie.
* **Statystyki:** Podsumowanie aktywności z ostatniego tygodnia, pozwalające śledzić postępy.
* **Nowa Sesja:** Wyraźny przycisk umożliwiający rozpoczęcie nowego cyklu nauki.

### Konfiguracja Nowej Sesji
Rozpoczęcie nauki wymaga przejścia przez proces personalizacji:
* **Wprowadzenie Treści:** Wklejenie tekstu źródłowego, który stanowi bazę do nauki i generowania pytań.
* **Metadane:** Nadanie sesji nazwy, opisu oraz wybór reprezentatywnej ikony.
* **Poziom Trudności:** Wybór jednego z trzech stopni: **Łatwy**, **Średni** lub **Trudny**.

---

## 2. Faza Uczenia: Interaktywny Quiz

W tej fazie ekran podzielony jest na dwie główne sekcje:
* **Obszar Tekstu (Główny):** Wyświetla wklejony wcześniej tekst źródłowy, umożliwiając stały wgląd w materiały.
* **Panel Quizu (Sidebar):** Interaktywny quiz typu ABCD.
    * Po zaznaczeniu odpowiedzi system natychmiast informuje, czy była ona poprawna.
    * Każda odpowiedź zawiera krótkie wyjaśnienie (feedback), tłumaczące dane zagadnienie.
    * Przycisk „Następne pytanie” pozwala na płynne przechodzenie przez kolejne etapy testu.

---

## 3. Faza Treningu Modelu: Pytania Otwarte

Trzeci etap to pogłębiona weryfikacja wiedzy:
* **Generowanie Pytań:** Na podstawie tekstu źródłowego system generuje 10 pytań otwartych, dostosowanych do wybranego poziomu trudności.
* **Interakcja:** Model zadaje pytania, a użytkownik musi udzielić jak najdokładniejszej odpowiedzi pisemnej.
* **Cel:** Celem jest precyzyjne przekazanie wiedzy modelowi, co symuluje proces „uczenia” sztucznej inteligencji przez użytkownika.

---

## 4. Faza Finałowa: Walka z Bossem

Kulminacyjny punkt sesji, w którym wiedza zamienia się w siłę bojową:
* **Mechanika RPG:** Strona wizualna opiera się na animacjach stylizowanych na gry RPG, przedstawiających starcie ucznia z potężnym przeciwnikiem.
* **Logika Walki:** System porównuje odpowiedzi udzielone przez użytkownika z odpowiedziami oczekiwanymi przez model.
* **Wskaźnik Sukcesu:** Im wyższa poprawność i precyzja odpowiedzi, tym silniejsze ataki wyprowadza postać gracza i tym większa szansa na pokonanie bossa.

---

## Podsumowanie i Progresja

Po zakończeniu walki wyświetlana jest strona podsumowująca:
* **Wynik Starcia:** Informacja o zwycięstwie lub porażce.
* **Statystyki:** Celność odpowiedzi wyrażona w procentach oraz liczba zdobytych punktów doświadczenia (**XP**).
* **Dalsze Kroki:** Możliwość przejścia do kolejnego poziomu (w przypadku wygranej) lub powrót do strony głównej.

### Ranking Graczy
Wszystkie zdobyte punkty XP sumują się i wpływają na pozycję w ogólnodostępnym rankingu:
1.  **Top 10 Dzisiaj:** Najlepsi gracze z bieżącej doby.
2.  **Top 10 Wszech czasów:** Legendarne wyniki najlepszych użytkowników aplikacji.

---

## Stos Technologiczny

Aplikacja została zbudowana w architekturze typu full-stack z wykorzystaniem nowoczesnych i wydajnych technologii. Część serwerowa (backend) opiera się na języku **Python**, frameworku **FastAPI** oraz bibliotece **SQLModel** do integracji z bazą danych **PostgreSQL** (zarządzaną za pomocą migracji **Alembic**), a inteligentne funkcjonalności RPG i generowanie pytań wspierane są przez silnik agentowy **LangGraph** oraz oficjalny pakiet **Google GenAI SDK**. Warstwa kliencka (frontend) została zaimplementowana w języku **TypeScript** z użyciem biblioteki **React 19** (budowanej przez **Vite** i zarządzanej przez **Bun**), ze stanem obsługiwanym przez **Zustand**, nawigacją opartą o **TanStack Router**, zapytaniami **TanStack Query** oraz nowoczesnym stylowaniem przy użyciu **Tailwind CSS v4** i komponentów bazujących na **Radix UI**. Całość środowiska uruchomieniowego jest w pełni skonteneryzowana za pomocą **Docker** i **Docker Compose**, co zapewnia spójność wdrożeniową i łatwe skalowanie dzięki odwrotnemu proxy **Traefik**.
