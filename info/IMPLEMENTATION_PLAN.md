# IMPLEMENTATION_PLAN.md — ALU3

Индекс implementation plan на основе [`SPEC.md`](./SPEC.md). Каждый шаг — отдельный файл в [`/steps`](./steps) с подробным описанием, критерием готовности и обоснованием места в последовательности. Шаги идут строго друг за другом (соло-разработка, без параллельных потоков) — не переходить к следующему, пока не закрыт критерий готовности предыдущего.

| # | Шаг | Фаза | Файл |
|---|---|---|---|
| 1 | Инициализация проекта | Setup | [steps/step1.md](./steps/step1.md) |
| 2 | Архитектура маршрутов и i18n | Setup | [steps/step2.md](./steps/step2.md) |
| 3 | Дизайн-система (основа) | Setup | [steps/step3.md](./steps/step3.md) |
| 4 | Компоненты страницы | Build | [steps/step4.md](./steps/step4.md) |
| 5 | Форма заявки и backend | Build | [steps/step5.md](./steps/step5.md) |
| 6 | SEO | Optimize | [steps/step6.md](./steps/step6.md) |
| 7 | Производительность | Optimize | [steps/step7.md](./steps/step7.md) |
| 8 | Accessibility | Optimize | [steps/step8.md](./steps/step8.md) |
| 9 | QA против Acceptance Criteria | Verify | [steps/step9.md](./steps/step9.md) |
| 10 | Пре-лонч чек-лист (домен, плейсхолдеры, реальный контент) | Launch prep | [steps/step10.md](./steps/step10.md) |
| 11 | Деплой и пост-лонч | Launch | [steps/step11.md](./steps/step11.md) |

## Зависимости между шагами

```mermaid
flowchart LR
    S1[1. Setup] --> S2[2. i18n/роутинг]
    S2 --> S3[3. Дизайн-система]
    S3 --> S4[4. Компоненты страницы]
    S4 --> S5[5. Форма и backend]
    S5 --> S6[6. SEO]
    S6 --> S7[7. Performance]
    S7 --> S8[8. Accessibility]
    S8 --> S9[9. QA]
    S9 --> S10[10. Пре-лонч]
    S10 --> S11[11. Деплой]
```

## Как пользоваться

1. Открыть файл текущего шага — там контекст из SPEC.md, подробные подзадачи и Definition of Done.
2. Имплементировать до полного закрытия чек-листа готовности в конце файла.
3. Перейти к следующему шагу только после этого — файлы написаны с учётом строгой последовательности, забегание вперёд (например компоненты до i18n) создаёт технический долг, описанный в обосновании каждого шага.
