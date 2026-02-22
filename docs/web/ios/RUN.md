# Dashka DE — iOS · RUN.md

## Требования
- Xcode 15+
- iOS 17+ target
- Swift 5.9+

## Запуск
1. Открой DashkaDE.xcodeproj в Xcode
2. Выбери симулятор iPhone 15 или реальное устройство
3. Cmd+R — Build & Run

## Permissions (Info.plist уже настроен)
- NSMicrophoneUsageDescription
- NSSpeechRecognitionUsageDescription

## Критерии приёмки
- Xcode build без ошибок
- Экран: заголовок Dashka German Translator
- Кнопка Wake Up работает -> индикатор зеленеет
- Текстовый перевод -> Deutsch
- Голосовой ввод (ru-RU) -> автоматический перевод на DE
