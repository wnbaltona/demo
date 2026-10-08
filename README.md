# Wersja testowa — GitHub Pages

Wgraj zawartość tej paczki do katalogu publikowanego przez GitHub Pages. Index.html jest w głównym katalogu. Nie potrzeba serwera Node, PostgreSQL ani logowania.

Aplikacja uruchamia się jako administrator testowy. W przełączniku „Użytkownik testowy” można wybrać administratora, koordynatora, kierownika albo użytkownika. Każdy może wykonywać działania dostępne dla swojej roli, a nie tylko oglądać ekran. Kierownik ma przypisany pierwszy lokal; administrator może zmienić MPK w panelu użytkowników.

Przykładowy test: jako Użytkownik dodaj zgłoszenie, przełącz na Koordynatora i potwierdź priorytet, dodaj komentarz, wróć do Użytkownika. Kierownik widzi zgłoszenia swojego MPK; zwykły użytkownik własne. Administrator zarządza lokalami i ustawieniami.

Dane i załączniki zapisują się tylko w tej przeglądarce (IndexedDB). Osoby na innych urządzeniach nie widzą tych samych danych. Nie wpisuj prawdziwych danych firmowych: to publiczny wariant demonstracyjny bez zabezpieczeń. Przełącznik jest funkcją testową, nie mechanizmem autoryzacji.

Push wyłączony. PDF dostępny do pobrania, bez biblioteki podglądu. Wylogowanie odświeża demonstrację. Usunięcie danych strony usuwa lokalne wpisy. To osobna baza testowa, nie nadpisuje poprzedniej demonstracji.
