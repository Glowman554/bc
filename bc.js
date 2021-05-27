const fs = require("fs");
const { execSync } = require("child_process");

if(process.argv.length != 4) {
	throw new Error("Please use " + process.argv[0] + " " + process.argv[1] + " <in file> <out file>");
}

const code = fs.readFileSync(process.argv[2]);
const prog_id = Math.floor(Math.random() * 9999999);

var compiled_code = "[section .data]\ntape: times 30000 db 0\n\n[section .text]\n[global _start]\n\n_start:\n\tmov eax, tape\n";

var loop = [];
var loop_id = 1;

if(!fs.existsSync("./tmp")) {
	fs.mkdirSync("./tmp");
}

code.toString().split("").forEach(element => {
	switch(element) {
		case "<":
			compiled_code += "\tdec eax\n";
			compiled_code += "\n";
			break;
		case ">":
			compiled_code += "\tinc eax\n";
			compiled_code += "\n";
			break;
		case "-":
			compiled_code += "\tdec byte [eax]\n";
			compiled_code += "\n";
			break;
		case "+":
			compiled_code += "\tinc byte [eax]\n";
			compiled_code += "\n";
			break;
		case ".":
			compiled_code += "\tpush eax\n";
			compiled_code += "\tmov edx, 1\n";
			compiled_code += "\tmov ecx, eax\n";
			compiled_code += "\tmov ebx, 1\n";
			compiled_code += "\tmov eax, 4\n";
			compiled_code += "\tint 0x80\n";
			compiled_code += "\tpop eax\n";
			compiled_code += "\n";
			break;
		case ",":
			compiled_code += "\tpush eax\n";
			compiled_code += "\tmov edx, 1\n";
			compiled_code += "\tmov ecx, eax\n";
			compiled_code += "\tmov ebx, 0\n";
			compiled_code += "\tmov eax, 3\n";
			compiled_code += "\tint 0x80\n";
			compiled_code += "\tpop eax\n";
			compiled_code += "\n";
			break;
		case "[":
			compiled_code += "_" + loop_id + "_loop:\n";
			loop.push(loop_id);
			loop_id++;
			compiled_code += "\n";
			break;
		case "]":
			var id = loop.pop();
			compiled_code += "\tcmp [eax], byte 0\n";
			compiled_code += "\tjne _" + id + "_loop\n";
			compiled_code += "\n";
			break;
		default:
			//console.log("Unknown instruction " + element);
			break;
	}
});

compiled_code += "\tmov ebx, 0\n\tmov eax, 1\n\tint 0x80";
console.log(compiled_code);
fs.writeFileSync("./tmp/" + prog_id + ".asm", compiled_code);

execSync(`nasm -f elf ./tmp/${prog_id}.asm -o ./tmp/${prog_id}.o`);
execSync(`ld -m elf_i386 ./tmp/${prog_id}.o -o ${process.argv[3]}`);