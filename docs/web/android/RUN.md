# Dashka DE — Android · RUN.md

## Требования
- Android Studio Hedgehog (2023.1.1)+
- Gradle 8.5
- minSdk 26 (Android 8.0+)
- Kotlin 2.0

## Запуск
1. Open in Android Studio: File -> Open -> папка android/
2. Gradle Sync (автоматически)
3. Run -> app (или Shift+F10)
4. Выбери эмулятор или устройство

## Permissions
- INTERNET (автоматически)
- RECORD_AUDIO (запрашивается при первом нажатии 🎤)

## Критерии приёмки
- Gradle sync ok, build ok
- Экран: заголовок Dashka German Translator
- Кнопка Wake Up работает -> индикатор зеленеет
- Текстовый перевод -> Deutsch
- Голосовой ввод (ru-RU) -> авто-перевод на DE
