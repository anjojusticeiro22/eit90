const CONTRACT_ADDRESS = "0x729abA65933f5663e0A55EF65A70feC97a8a0af9";
const CONTRACT_ABI = [
    "function mintScore(string tokenURI) public returns (uint256)"
];

let boardState = Array(8).fill(null).map(() => Array(8).fill(null));
let queenPositions = [];

const board = document.getElementById("board");
const mintBtn = document.getElementById("mintBtn");
const status = document.getElementById("status");

// Cria o tabuleiro
function createBoard() {
    board.innerHTML = "";
    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){
            const square = document.createElement("div");
            square.classList.add("square");
            square.classList.add((r+c)%2===0?"white":"black");
            square.dataset.row = r;
            square.dataset.col = c;
            square.onclick = handleClick;
            board.appendChild(square);
        }
    }
}

function handleClick(e){
    const r = parseInt(e.currentTarget.dataset.row);
    const c = parseInt(e.currentTarget.dataset.col);

    if(boardState[r][c] === "Q"){
        boardState[r][c] = null;
        queenPositions = queenPositions.filter(pos => !(pos[0]===r && pos[1]===c));
    } else {
        if(e.currentTarget.classList.contains("invalid")) return;
        boardState[r][c] = "Q";
        queenPositions.push([r,c]);
    }
    updateBoard();
    mintBtn.disabled = queenPositions.length !== 8;
}

// Marca casas atacadas
function updateBoard(){
    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){
            const idx = r*8 + c;
            const square = board.children[idx];
            square.textContent = boardState[r][c] || "";
            square.classList.remove("invalid");
        }
    }

    queenPositions.forEach(([qr,qc])=>{
        for(let i=0;i<8;i++){
            if(boardState[qr][i] !== "Q") board.children[qr*8+i].classList.add("invalid");
            if(boardState[i][qc] !== "Q") board.children[i*8+qc].classList.add("invalid");
        }
        for(let dr=-7; dr<=7; dr++){
            if(dr===0) continue;
            let r1=qr+dr, c1=qc+dr;
            let r2=qr+dr, c2=qc-dr;
            if(r1>=0 && r1<8 && c1>=0 && c1<8 && boardState[r1][c1]!=="Q") board.children[r1*8+c1].classList.add("invalid");
            if(r2>=0 && r2<8 && c2>=0 && c2<8 && boardState[r2][c2]!=="Q") board.children[r2*8+c2].classList.add("invalid");
        }
    });
}

// Mint NFT
async function mintNFT(){
    try{
        if(!window.ethereum){ 
            alert("Instale MetaMask ou Rabby"); 
            return; 
        }

        // Conecta provider Arc
        const provider = new ethers.BrowserProvider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        const network = await provider.getNetwork();
        console.log("Network:", network);

        if(network.chainId !== 5042002){ 
            alert("⚠️ Mude sua carteira para Arc Testnet");
            return;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const tokenURI = JSON.stringify({
            moves: queenPositions.length,
            positions: queenPositions,
            timestamp: Date.now()
        });

        status.textContent = "📝 Abrindo assinatura na carteira...";
        const tx = await contract.mintScore(tokenURI);
        status.textContent = `💳 Transação enviada: ${tx.hash}`;
        const receipt = await tx.wait();
        status.textContent = `✅ NFT mintado no bloco ${receipt.blockNumber}`;
    } catch(err){
        console.error(err);
        status.textContent = `❌ Erro: ${err.message||err}`;
    }
}

mintBtn.onclick = mintNFT;

createBoard();
