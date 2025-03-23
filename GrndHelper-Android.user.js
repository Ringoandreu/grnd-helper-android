// ==UserScript==
// @name         Автоответчик жалоб (Android)
// @namespace    Grnd Helper for Android By Ringo
// @version      3.0
// @description  Автоматизация ответов на жалобы и генерации команд (мут, бан, варн и т. д.)
// @author       Ringo
// @match        https://grnd.gg/admin/complaints
// @match        https://grnd.gg/admin/complaints/*
// @updateURL    https://raw.githubusercontent.com/Ringoandreu/grnd-helper-android/main/GrndHelper-Android.user.js
// @downloadURL  https://raw.githubusercontent.com/Ringoandreu/grnd-helper-android/main/GrndHelper-Android.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("🚀 Grnd Helper for Android запущен!");

    // Новые шаблоны вердиктов
    const verdictTemplates = [
        {
    "category": "default",
    "description": "Неверный формат жалобы",
    "name": "Жалоба с нарушением правил",
    "text": "Приветствую, {complaintSender}.\nЖалоба {complaintNumber} не подлежит рассмотрению, так как она составлена с нарушением правил подачи жалоб. Просим вас внимательно ознакомиться с требованиями и отправить корректно оформленную жалобу. Закрыто."
  },
  {
    "category": "default",
    "description": "Жалоба без информации",
    "name": "Пустышка",
    "text": "Приветствую, уважаемый {complaintSender}.\n\nЖалоба {complaintNumber} была рассмотрена и отклонена. Просим Вас составить новую жалобу с подробным описанием ситуации и предоставленными доказательствами (при наличии). Закрыто."
  },
  {
    "category": "default",
    "description": "Жалоба продублирована",
    "name": "Дубликат",
    "text": "Приветствую, уважаемый {complaintSender}.\nВаша жалоба {complaintNumber} была рассмотрена и отклонена, так как является дубликатом предыдущей. Закрыто."
  },
  {
    "category": "default",
    "description": "Недостаточно доказательств",
    "name": "Нехватка док-в",
    "text": "Приветствую, уважаемый {complaintSender}. Ваша жалоба {complaintNumber} была рассмотрена и отклонена по причине: нехватка доказательств. Закрыто."
  },
  {
    "category": "player",
    "description": "Последует блокировка аккаутнта",
    "name": "Одобрено (ban)",
    "text": "Приветствую, уважаемый {complaintSender}. Ваша жалоба {complaintNumber} была рассмотрена и одобрена. Игрок {accusedNick} будет наказан блокировкой аккаунта на N дней за \"причина\"."
  },
  {
    "category": "default",
    "description": "Последует JAIL",
    "name": "Одобрено (деморган)",
    "text": "Приветствую, уважаемый {complaintSender}. Ваша жалоба {complaintNumber} была рассмотрена и одобрена. Игрок {accusedNick} будет наказан деморганом на N минут за \"причина\"."
  },
  {
    "category": "default",
    "description": "Последует блокировка чата",
    "name": "Одобрено (mute)",
    "text": "Приветствую, уважаемый {complaintSender}. Ваша жалоба {complaintNumber} была рассмотрена и одобрена. Игрок {accusedNick} будет наказан блокировкой чата на N минут за \"причина\"."
  },
  {
    "category": "player",
    "description": "Последует игровое предупреждение (WARN)",
    "name": "Одобрено (warn)",
    "text": "Приветствую, уважаемый {complaintSender}. Ваша жалоба {complaintNumber} была рассмотрена и одобрена. Игрок {accusedNick} будет наказан варном за \"нарушение\""
  },
  {
    "category": "player",
    "description": "Игрок не нарушает",
    "name": "Игрок не нарушает",
    "text": "Приветствую, уважаемый {complaintSender}. Ваша жалоба {complaintNumber} была рассмотрена и отклонена. Игрок {accusedNick} не нарушает правила проекта."
  }
    ];

    function addPunishmentForm() {
        const infoBlock = document.querySelector(".content-info");
        if (!infoBlock) {
            console.error("❌ Элемент .content-info не найден!");
            return;
        }

        console.log("✅ Найден .content-info, добавляем форму...");

        const formContainer = document.createElement("div");
        formContainer.classList.add("punishment-form");
        formContainer.style.background = "#222";
        formContainer.style.padding = "10px";
        formContainer.style.borderRadius = "8px";
        formContainer.style.color = "white";
        formContainer.style.marginTop = "10px";
        formContainer.style.maxWidth = "300px";
        formContainer.style.fontSize = "14px";
        formContainer.style.position = "relative";

        // Заголовок блока
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.marginBottom = "8px";
        header.style.fontSize = "14px";
        header.style.fontWeight = "bold";

        const headerIcon = document.createElement("span");
        headerIcon.innerText = "⚖️";
        headerIcon.style.marginRight = "8px";

        const headerText = document.createElement("span");
        headerText.innerText = "Выдача наказания";

        header.appendChild(headerIcon);
        header.appendChild(headerText);
        formContainer.appendChild(header);

        // Список наказаний
        const punishmentSelect = document.createElement("select");
        punishmentSelect.innerHTML = `
            <option value="" disabled selected>Выберите наказание</option>
            <option value="offmute">Mute</option>
            <option value="offjail">Jail</option>
            <option value="offban">Ban</option>
            <option value="offwarn">Warn</option>
        `;
        punishmentSelect.style.width = "100%";
        punishmentSelect.style.marginBottom = "8px";
        punishmentSelect.style.background = "#333";
        punishmentSelect.style.color = "#fff";
        punishmentSelect.style.border = "1px solid #444";
        punishmentSelect.style.padding = "5px";
        punishmentSelect.style.borderRadius = "5px";
        punishmentSelect.style.fontSize = "14px";

        // Поле ввода времени
        const timeInput = document.createElement("input");
        timeInput.type = "number";
        timeInput.placeholder = "Время (мин)";
        timeInput.min = "1";
        timeInput.style.width = "100%";
        timeInput.style.marginBottom = "8px";
        timeInput.style.background = "#333";
        timeInput.style.color = "#fff";
        timeInput.style.border = "1px solid #444";
        timeInput.style.padding = "5px";
        timeInput.style.borderRadius = "5px";
        timeInput.style.fontSize = "14px";

        // Контейнер для выбора правила
        const ruleContainer = document.createElement("div");
        ruleContainer.style.position = "relative";
        ruleContainer.style.width = "100%";
        ruleContainer.style.marginBottom = "8px";

        // Поле ввода правила
        const ruleInput = document.createElement("input");
        ruleInput.type = "text";
        ruleInput.placeholder = "Пункт правил";
        ruleInput.style.width = "calc(100% - 40px)";
        ruleInput.style.marginRight = "10px";
        ruleInput.style.background = "#333";
        ruleInput.style.color = "#fff";
        ruleInput.style.border = "1px solid #444";
        ruleInput.style.padding = "5px";
        ruleInput.style.borderRadius = "5px";
        ruleInput.style.fontSize = "14px";

        // Кнопка-иконка для выбора правила
        const ruleDropdownButton = document.createElement("button");
        ruleDropdownButton.innerHTML = "📜";
        ruleDropdownButton.style.position = "absolute";
        ruleDropdownButton.style.right = "0";
        ruleDropdownButton.style.top = "0";
        ruleDropdownButton.style.border = "none";
        ruleDropdownButton.style.background = "#444";
        ruleDropdownButton.style.color = "#fff";
        ruleDropdownButton.style.cursor = "pointer";
        ruleDropdownButton.style.fontSize = "14px";
        ruleDropdownButton.style.width = "30px";
        ruleDropdownButton.style.height = "30px";
        ruleDropdownButton.style.borderRadius = "5px";

        // Выпадающий список правил
        const ruleDropdown = document.createElement("ul");
        ruleDropdown.style.position = "absolute";
        ruleDropdown.style.top = "100%";
        ruleDropdown.style.left = "0";
        ruleDropdown.style.width = "100%";
        ruleDropdown.style.background = "#333";
        ruleDropdown.style.color = "#fff";
        ruleDropdown.style.border = "1px solid #444";
        ruleDropdown.style.borderRadius = "5px";
        ruleDropdown.style.display = "none";
        ruleDropdown.style.listStyle = "none";
        ruleDropdown.style.padding = "5px 0";
        ruleDropdown.style.maxHeight = "200px";
        ruleDropdown.style.overflowY = "auto";
        ruleDropdown.style.zIndex = "1000";

        // Список правил
        const rules = [
            { code: "2.1 ОП", desc: "Оскорбления" },
            { code: "2.2 ОП", desc: "Флуд" },
            { code: "3.2 ОП", desc: "Обман клевета Адм." },
            { code: "5.2 ОП", desc: "Cофт" },
            { code: "5.4 ОП", desc: "Уход от РП" },
            { code: "5.7 ОП", desc: "SK жильцов дома" },
            { code: "SK", desc: "Spawn Kill" },
            { code: "DB", desc: "DriveBy" },
            { code: "DM", desc: "DeathMatch" },
            { code: "UB", desc: "Unrealistic Behavior" },
            { code: "1.1 GZ", desc: "Убийство в GreenZone" }
        ];

        rules.forEach(rule => {
            const listItem = document.createElement("li");
            listItem.innerText = `${rule.code} - ${rule.desc}`;
            listItem.style.padding = "5px 10px";
            listItem.style.cursor = "pointer";
            listItem.style.fontSize = "14px";
            listItem.addEventListener("click", () => {
                ruleInput.value = rule.code;
                ruleDropdown.style.display = "none";
            });
            listItem.addEventListener("mouseenter", () => {
                listItem.style.background = "#444";
            });
            listItem.addEventListener("mouseleave", () => {
                listItem.style.background = "transparent";
            });
            ruleDropdown.appendChild(listItem);
        });

        ruleDropdownButton.addEventListener("click", () => {
            ruleDropdown.style.display = ruleDropdown.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", (event) => {
            if (!ruleContainer.contains(event.target)) {
                ruleDropdown.style.display = "none";
            }
        });

        ruleContainer.appendChild(ruleInput);
        ruleContainer.appendChild(ruleDropdownButton);
        ruleContainer.appendChild(ruleDropdown);

        // Кнопка копирования
        const generateButton = document.createElement("button");
        generateButton.innerText = "Скопировать";
        generateButton.style.marginTop = "8px";
        generateButton.style.background = "#28a745";
        generateButton.style.color = "white";
        generateButton.style.border = "none";
        generateButton.style.padding = "8px";
        generateButton.style.borderRadius = "5px";
        generateButton.style.width = "100%";
        generateButton.style.cursor = "pointer";
        generateButton.style.fontSize = "14px";
        generateButton.addEventListener("click", () => {
            const selectedPunishment = punishmentSelect.value;
            const time = timeInput.value.trim();
            const rule = ruleInput.value.trim();

            if (!selectedPunishment) {
                showAlert("❌ Выберите наказание!");
                return;
            }

            if (!rule) {
                showAlert("❌ Укажите пункт правил!");
                return;
            }

            if (selectedPunishment !== "offwarn" && !time) {
                showAlert("❌ Укажите время!");
                return;
            }

            generateCommand(selectedPunishment, time, rule);
        });

        // Обработка изменения выбора наказания
        punishmentSelect.addEventListener("change", () => {
            const selectedPunishment = punishmentSelect.value;
            if (selectedPunishment === "offwarn") {
                timeInput.disabled = true;
                timeInput.placeholder = "Время не требуется";
                timeInput.value = "";
            } else if (selectedPunishment === "offban") {
                timeInput.disabled = false;
                timeInput.placeholder = "Время (дней)";
            } else {
                timeInput.disabled = false;
                timeInput.placeholder = "Время (мин)";
            }
        });

        formContainer.append(punishmentSelect, timeInput, ruleContainer, generateButton);
        infoBlock.parentNode.insertBefore(formContainer, infoBlock.nextSibling);

        console.log("✅ Форма успешно добавлена!");

        // Добавляем кнопки вердикта
        addVerdictButtons(formContainer);
    }

    function generateCommand(type, time, rule) {
        const accusedElement = document.querySelector(".content-info .item:nth-child(3) .title");
        const complaintNumberElement = document.querySelector(".content-info .item:nth-child(1) .title");

        if (!accusedElement || !complaintNumberElement) {
            showAlert("❌ Ошибка: Не удалось найти данные на странице.");
            return;
        }

        const accusedNick = accusedElement.textContent.trim();
        const complaintNumber = complaintNumberElement.textContent.replace("# ", "#").trim();
        let command = `/${type} ${accusedNick} ${time ? time + ' ' : ''}${rule} |ЖБ ${complaintNumber}`;

        navigator.clipboard.writeText(command).then(() => {
            showAlert("✅ Команда скопирована: " + command);
        }).catch(err => {
            console.error("Ошибка при копировании команды: ", err);
            showAlert("❌ Ошибка при копировании команды.");
        });
    }

    function showAlert(message) {
        alert(message);
    }

    function addVerdictButtons(formContainer) {
        const verdictButtonsContainer = document.createElement("div");
        verdictButtonsContainer.style.display = "grid";
        verdictButtonsContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
        verdictButtonsContainer.style.gap = "10px";
        verdictButtonsContainer.style.marginLeft = "20px";
        verdictButtonsContainer.style.width = "300px";
        verdictButtonsContainer.style.position = "absolute";
        verdictButtonsContainer.style.right = "-320px";
        verdictButtonsContainer.style.top = "0";

        verdictTemplates.forEach(template => {
            const btn = document.createElement("button");
            btn.innerText = template.name;
            btn.style.background = "#444";
            btn.style.color = "#fff";
            btn.style.border = "none";
            btn.style.padding = "8px";
            btn.style.borderRadius = "5px";
            btn.style.cursor = "pointer";
            btn.style.fontSize = "12px";
            btn.addEventListener("click", () => {
                const complaintSender = document.querySelector(".content-info .item:nth-child(2) .title")?.textContent.trim() || "пользователь";
                const complaintNumber = document.querySelector(".content-info .item:nth-child(1) .title")?.textContent.replace("# ", "#").trim() || "N/A";
                const accusedNick = document.querySelector(".content-info .item:nth-child(3) .title")?.textContent.trim() || "N/A";

                const verdictText = template.text
                    .replace("{complaintSender}", complaintSender)
                    .replace("{complaintNumber}", complaintNumber)
                    .replace("{accusedNick}", accusedNick);

                const verdictInput = document.querySelector(".verdict textarea");
                if (verdictInput) {
                    verdictInput.value = verdictText;
                    btn.style.background = "#28a745";
                    setTimeout(() => {
                        btn.style.background = "#444";
                    }, 150);
                } else {
                    showAlert("❌ Поле 'Ваш вердикт' не найдено!");
                }
            });
            verdictButtonsContainer.appendChild(btn);
        });

        formContainer.appendChild(verdictButtonsContainer);
        console.log("✅ Кнопки вердикта успешно добавлены!");
    }

    setTimeout(() => {
        addPunishmentForm();
    }, 1500);
})();