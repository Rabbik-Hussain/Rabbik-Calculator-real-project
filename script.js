const currentOperandElement = document.getElementById('current-operand');
const previousOperandElement = document.getElementById('previous-operand');

let currentExpression = '';
let isEvaluated = false;

// Theme Toggle Functionality
function toggleTheme() {
    const toggle = document.getElementById('mode-toggle');
    if (toggle.checked) {
        document.body.classList.remove('night-mode');
        document.body.classList.add('day-mode');
    } else {
        document.body.classList.remove('day-mode');
        document.body.classList.add('night-mode');
    }
}

function updateDisplay() {
    currentOperandElement.innerText = currentExpression || '0';
}

function isOperator(char) {
    return ['+', '-', '×', '÷', '%'].includes(char);
}

function appendCharacter(char) {
    if (isEvaluated && !isOperator(char)) {
        currentExpression = '';
    }
    isEvaluated = false;

    const lastChar = currentExpression.slice(-1);

    // দশমিক পয়েন্ট ফিল্টার
    if (char === '.') {
        const parts = currentExpression.split(/[\+\-\×\÷\(\)]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) return;
    }

    // ঋণাত্মক সংখ্যা ইনপুট সাপোর্টিং
    if (char === '-') {
        if (currentExpression === '' || ['+', '-', '×', '÷', '('].includes(lastChar)) {
            currentExpression += char;
            updateDisplay();
            return;
        }
    }

    // পরপর দুটি অপারেটর সংশোধন
    if (isOperator(char) && isOperator(lastChar)) {
        if (lastChar === '-' && (currentExpression.length === 1 || ['+', '-', '×', '÷', '('].includes(currentExpression.slice(-2, -1)))) {
            return;
        }
        currentExpression = currentExpression.slice(0, -1) + char;
    } else {
        currentExpression += char;
    }
    updateDisplay();
}

function toggleSign() {
    if (isEvaluated) isEvaluated = false;

    if (currentExpression === '') {
        currentExpression = '-';
        updateDisplay();
        return;
    }

    const regex = /(?:(-?\d+(?:\.\d+)?)|(-))$/;
    const match = currentExpression.match(regex);

    if (match) {
        if (match[2] === '-') {
            currentExpression = currentExpression.slice(0, -1);
        } else if (match[1]) {
            let numStr = match[1];
            let startIndex = match.index;

            if (numStr.startsWith('-')) {
                numStr = numStr.substring(1);
            } else {
                numStr = '-' + numStr;
            }

            currentExpression = currentExpression.substring(0, startIndex) + numStr;
        }
    } else {
        const lastChar = currentExpression.slice(-1);
        if (['+', '×', '÷', '('].includes(lastChar)) {
            currentExpression += '-';
        }
    }
    updateDisplay();
}

function clearAll() {
    currentExpression = '';
    previousOperandElement.innerText = '';
    updateDisplay();
}

function deleteDigit() {
    if (isEvaluated) {
        clearAll();
        return;
    }
    currentExpression = currentExpression.slice(0, -1);
    updateDisplay();
}

function prepareExpression(expr) {
    let formatted = expr
        .replace(/(\d)(\()/g, '$1*$2')       // 5( -> 5*(         .replace(/(\))(\d)/g, '$1*$2')       // )5 -> )*5
        .replace(/(\))(\()/g, '$1*$2')       // )( -> )*(
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

    // স্মার্ট পার্সেন্টেজ হিসাব
    formatted = formatted.replace(/(\d+(?:\.\d+)?)\s*([\+\-])\s*(\d+(?:\.\d+)?)%/g, (match, base, op, percent) => {
        return `${base} ${op} (${base} * ${percent} / 100)`;
    });

    formatted = formatted.replace(/%/g, '/100');

    return formatted;
}

function safeEvaluate(expr) {
    if (/[^0-9\+\-\*\/\.\(\)\s]/.test(expr)) {
        throw new Error("Invalid Characters");
    }
    return new Function(`'use strict'; return (${expr})`)();
}

function calculate() {
    if (!currentExpression) return;

    try {
        let formatted = prepareExpression(currentExpression);
        let result = safeEvaluate(formatted);

        if (result === undefined || isNaN(result) || !isFinite(result)) {
            throw new Error("Invalid Result");
        }

        result = Math.round(result * 1e10) / 1e10;

        previousOperandElement.innerText = currentExpression + ' =';
        currentExpression = result.toString();
        isEvaluated = true;
        updateDisplay();
    } catch (error) {
        currentOperandElement.innerText = 'Error';
        setTimeout(() => {
            clearAll();
        }, 1300);
    }
}

// কিবোর্ড সাপোর্ট
document.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') appendCharacter(e.key);
    if (e.key === '+') appendCharacter('+');
    if (e.key === '-') appendCharacter('-');
    if (e.key === '*') appendCharacter('×');
    if (e.key === '/') { e.preventDefault(); appendCharacter('÷'); }
    if (e.key === '%') appendCharacter('%');
    if (e.key === '(') appendCharacter('(');
    if (e.key === ')') appendCharacter(')');
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calculate(); }
    if (e.key === 'Backspace') deleteDigit();
    if (e.key === 'Escape') clearAll();
});