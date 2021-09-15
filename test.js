const fs = require("fs");
const path = require("path");
const { exec } = require('child_process');
const pdf = require("pdf-parse");

const getTests = (text) => {
    const problems = text.split("Problem")
        .slice(1)
        .map(problem => problem.trim());
    let tests = [];
    problems.forEach(problem => {
        const problemTests = problem.split("Sample Input").slice(1);
        let problemTestObjects = [];
        problemTests.forEach(problemTest => {
            const input = problemTest.split("Sample Output")[0].slice(3).trim();
            let output = problemTest
                .split("Sample Output")[1]
                .slice(3)
                .split("Page")[0]
                .trim();
            const testObject = { input, output };
            problemTestObjects.push(testObject);
        })
        tests.push(problemTestObjects);
    });
    return tests;
}

const saveTests = (tests) => {
    const dir = process.argv[3] + '/tests/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    tests.forEach((problem, i) => {
        if (!fs.existsSync(`${dir}problem${i}`))
            fs.mkdirSync(`${dir}problem${i}`, { recursive: true });
        problem.forEach((test, j) => {
            console.log(test)
            console.log(`${dir}problem${i}/input${j}`);
            fs.writeFileSync(`${dir}problem${i}/input${j}.txt`, test.input);
            fs.writeFileSync(`${dir}problem${i}/output${j}.txt`, test.output);
        });
    });
}

const runTests = async (tests, programPath, problemIndex) => {
    const problemTests = tests[problemIndex - 1];
    await exec(`g++ -std=c11 -o out ${programPath}`, (error, stdout, stderr) => {
        error && console.log(error);
        stderr && console.log(stderr);
        console.log(stdout);
    });
    problemTests.forEach(async (test, i) => {
        exec(`echo "${test.input}" | ./out`, (error, stdout, stderr) => {
            error && console.log(error);
            stderr && console.log(stderr);
            if (test.output === stdout) console.log(`Test #${i + 1} passed!`);
            else {
                console.log(`Test #${i + 1} failed:`);
                console.log(`\tInput:\n\t${test.input}\n`)
                console.log(`\tExpected output:\n\t${test.output}\n`);
                console.log(`\tActual output:\n\t${stdout}\n`);
            }
        });
    });
    exec('rm ./out');
}

const start = async () => {
    const problemIndex = process.argv[3];
    let pdfPath, programPath;
    const dir =
        await fs.promises.opendir(`${process.argv[2]}/`);
    for await (const dirent of dir) {
        if (path.extname(dirent.name) === ".pdf") pdfPath = `${process.argv[2]}/${dirent.name}`;
        else if (path.extname(dirent.name) === ".c") programPath = `${process.argv[2]}/${dirent.name}`;
    }
    pdf(pdfPath).then(data => {
        runTests(getTests(data.text), programPath, problemIndex)
    })
}

start();