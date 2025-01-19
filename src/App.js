import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card, Alert, Table } from 'react-bootstrap';

function App() {
    const [fechamentoAberto, setFechamentoAberto] = useState(null);
    const [allFechamentos, setAllFechamentos] = useState([]);
    const [mesasFechamentoAberto, setMesasFechamentoAberto] = useState([]);
    const [novaMesaNumero, setNovaMesaNumero] = useState('');

    const [contasDaMesaSelecionada, setContasDaMesaSelecionada] = useState([]);

    const [mesaSelecionada, setMesaSelecionada] = useState('');
    const [mesaSelecionadaObj, setMesaSelecionadaObj] = useState(null);

    const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
    const [produtoSelecionado, setProdutoSelecionado] = useState('');
    const [quantidadeProduto, setQuantidadeProduto] = useState(1);

    const [itensPedido, setItensPedido] = useState([]); // [{produto, quantidade, total}, ...]
    const [contaFechadaTotal, setContaFechadaTotal] = useState(null);

    const [errorMessage, setErrorMessage] = useState('');

    // -------- Novos states para Cliente --------
    const [clientes, setClientes] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState('');
    const [newClient, setNewClient] = useState({
        nome: '',
        telefone: '',
        endereco: '',
        email: '',
        cpf: ''
    });

    const baseUrl = 'http://localhost:8080'; // Ajuste se necessário

    // Carrega fechamentos e fechamento aberto
    useEffect(() => {
        fetch(`${baseUrl}/api/fechamentos`)
            .then(res => res.json())
            .then(data => setAllFechamentos(data))
            .catch(err => console.error(err));

        fetch(`${baseUrl}/api/fechamentos/aberto`)
            .then(res => {
                if (!res.ok) throw new Error('Nenhum fechamento aberto no momento.');
                return res.json();
            })
            .then(data => setFechamentoAberto(data))
            .catch(() => setFechamentoAberto(null));
    }, [baseUrl]);

    // Carrega mesas do fechamento aberto
    useEffect(() => {
        if (fechamentoAberto) {
            fetch(`${baseUrl}/api/fechamentos/aberto/mesas`)
                .then(res => res.json())
                .then(data => setMesasFechamentoAberto(data))
                .catch(err => console.error(err));
        } else {
            setMesasFechamentoAberto([]);
        }
    }, [fechamentoAberto, baseUrl]);

    // Carrega lista de produtos disponíveis
    useEffect(() => {
        fetch(`${baseUrl}/api/produtos`)
            .then(res => (res.ok ? res.json() : []))
            .then(data => setProdutosDisponiveis(data))
            .catch(() => setProdutosDisponiveis([]));
    }, [baseUrl]);

    // -------- Carrega lista de clientes --------
    useEffect(() => {
        fetch(`${baseUrl}/api/clientes`)
            .then(res => (res.ok ? res.json() : []))
            .then(data => setClientes(data))
            .catch(err => console.error(err));
    }, [baseUrl]);

    // Função para carregar contas da mesa selecionada usando a nova rota
    const carregarContasDaMesa = (mesaId) => {
        if (!mesaId) {
            setContasDaMesaSelecionada([]);
            return;
        }

        fetch(`${baseUrl}/api/contas/mesa/${mesaId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Erro ao buscar contas da mesa selecionada.');
                }
                return res.json();
            })
            .then(data => setContasDaMesaSelecionada(data))
            .catch(err => {
                setErrorMessage(err.message);
                setContasDaMesaSelecionada([]);
            });
    };

    // Atualiza mesas e contas após alguma ação
    const atualizarDados = () => {
        if (fechamentoAberto) {
            fetch(`${baseUrl}/api/fechamentos/aberto/mesas`)
                .then(res => res.json())
                .then(data => {
                    setMesasFechamentoAberto(data);
                    carregarContasDaMesa(mesaSelecionada);
                })
                .catch(err => console.error(err));
        } else {
            setMesasFechamentoAberto([]);
            setContasDaMesaSelecionada([]);
        }
    };

    // Atualiza as contas da mesa sempre que a mesa selecionada mudar
    useEffect(() => {
        carregarContasDaMesa(mesaSelecionada);
    }, [mesaSelecionada]);

    const abrirFechamento = () => {
        fetch(`${baseUrl}/api/fechamentos/abrir`, {
            method: 'POST'
        })
            .then(res => res.json())
            .then(data => {
                setFechamentoAberto(data);
                setAllFechamentos(prev => [...prev, data]);
                atualizarDados();
            })
            .catch(err => setErrorMessage(err.message));
    };

    const fecharFechamento = () => {
        fetch(`${baseUrl}/api/fechamentos/fechar`, {
            method: 'POST'
        })
            .then(res => res.json())
            .then(() => {
                setFechamentoAberto(null);
                // Atualiza lista geral de fechamentos
                fetch(`${baseUrl}/api/fechamentos`)
                    .then(res => res.json())
                    .then(d => setAllFechamentos(d));
                setMesasFechamentoAberto([]);
                setContasDaMesaSelecionada([]);
            })
            .catch(err => setErrorMessage(err.message));
    };

    const criarMesaNoFechamentoAberto = () => {
        if (!novaMesaNumero) return;
        fetch(`${baseUrl}/api/fechamentos/aberto/mesas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numero: parseInt(novaMesaNumero),
                status: 'DISPONIVEL',
                idfechamento: fechamentoAberto ? fechamentoAberto.id : ''
            })
        })
            .then(res => {
                if (!res.ok) return res.text().then(t => { throw new Error(t); });
                return res.json();
            })
            .then(mesa => {
                setMesasFechamentoAberto(prev => [...prev, mesa]);
                setNovaMesaNumero('');
            })
            .catch(err => setErrorMessage(err.message));
    };

    // --------------- ATUALIZAÇÃO: inserir ID do cliente ao abrir conta ---------------
    const abrirConta = () => {
        if (!mesaSelecionada) {
            setErrorMessage("Selecione uma mesa disponível para abrir a conta.");
            return;
        }
        if (!selectedCliente) {
            setErrorMessage("Selecione um cliente para abrir a conta.");
            return;
        }

        fetch(`${baseUrl}/api/contas/abrir/${mesaSelecionada}?idCliente=${selectedCliente}`, {
            method: 'POST'
        })
            .then(res => {
                if (!res.ok) return res.text().then(t => { throw new Error(t); });
                return res.json();
            })
            .then(() => {
                setErrorMessage('');
                atualizarDados();
            })
            .catch(err => setErrorMessage(err.message));
    };

    const adicionarItemAoPedido = () => {
        if (!produtoSelecionado || quantidadeProduto < 1) {
            setErrorMessage('Selecione um produto e uma quantidade válida.');
            return;
        }

        const prodObj = produtosDisponiveis.find(p => p.id === produtoSelecionado);
        if (!prodObj) {
            setErrorMessage('Produto não encontrado.');
            return;
        }

        // Atualiza o array `itensPedido` para armazenar apenas o ID do produto e a quantidade
        const novoItem = {
            idProduto: produtoSelecionado, // Apenas o ID do produto
            quantidade: quantidadeProduto,
        };

        setItensPedido([...itensPedido, novoItem]);
        setErrorMessage('');
    };

    const criarPedido = () => {
        if (!mesaSelecionadaObj) return;
        const contaDaMesa = contasDaMesaSelecionada.find(c => c.idMesa === mesaSelecionadaObj.id && c.status === "ABERTA");
        if (!contaDaMesa) {
            setErrorMessage('Nenhuma conta aberta para esta mesa.');
            return;
        }

        if (itensPedido.length === 0) {
            setErrorMessage('Adicione pelo menos um item ao pedido.');
            return;
        }

        // Envia apenas os IDs e quantidades
        fetch(`${baseUrl}/api/contas/${contaDaMesa.id}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produtos: itensPedido }), // `itensPedido` já contém o formato correto
        })
            .then(res => {
                if (!res.ok) return res.text().then(t => { throw new Error(t); });
                return res.json();
            })
            .then(() => {
                setErrorMessage('');
                alert('Pedido criado com sucesso!');
                setItensPedido([]);
                setQuantidadeProduto(1);
                setProdutoSelecionado('');
                atualizarDados();
            })
            .catch(err => setErrorMessage(err.message));
    };



    const fecharConta = () => {
        if (!mesaSelecionadaObj) return;
        const contaDaMesa = contasDaMesaSelecionada.find(c => c.idMesa === mesaSelecionadaObj.id && c.status === "ABERTA");
        if (!contaDaMesa) {
            setErrorMessage('Nenhuma conta aberta para esta mesa.');
            return;
        }

        fetch(`${baseUrl}/api/contas/${contaDaMesa.id}/fechar`, {
            method: 'POST'
        })
            .then(res => {
                if (!res.ok) return res.text().then(t => { throw new Error(t); });
                return res.json();
            })
            .then(total => {
                setContaFechadaTotal(total);
                atualizarDados();
                setItensPedido([]);
            })
            .catch(err => setErrorMessage(err.message));
    };

    const handleMesaChange = (e) => {
        const mesaId = e.target.value;
        setMesaSelecionada(mesaId);
        const mesaObj = mesasFechamentoAberto.find(m => m.id === mesaId);
        setMesaSelecionadaObj(mesaObj || null);
        setContaFechadaTotal(null);
        setItensPedido([]);
        setErrorMessage('');
    };

    // --------------- NOVA FUNÇÃO: Cadastrar Cliente ---------------
    const registerCliente = () => {
        // Simples validação
        if (!newClient.nome || !newClient.cpf) {
            setErrorMessage('Nome e CPF são obrigatórios.');
            return;
        }

        fetch(`${baseUrl}/api/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        })
            .then(res => {
                if (!res.ok) throw new Error('Erro ao criar cliente.');
                return res.json();
            })
            .then(cliente => {
                // Adiciona o novo cliente na lista de clientes
                setClientes([...clientes, cliente]);
                // Limpa o form
                setNewClient({
                    nome: '',
                    telefone: '',
                    endereco: '',
                    email: '',
                    cpf: ''
                });
                setErrorMessage('');
            })
            .catch(err => setErrorMessage(err.message));
    };

    return (
        <Container className="mt-4">
            {errorMessage && (
                <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
                    {errorMessage}
                </Alert>
            )}
            <Row>
                {/* COLUNA ESQUERDA */}
                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Header>Fechamento</Card.Header>
                        <Card.Body>
                            {fechamentoAberto ? (
                                <>
                                    <p><strong>ID Fechamento Aberto:</strong> {fechamentoAberto.id}</p>
                                    <Button variant="danger" onClick={fecharFechamento}>
                                        Fechar Fechamento
                                    </Button>
                                </>
                            ) : (
                                <Button variant="success" onClick={abrirFechamento}>
                                    Abrir Fechamento
                                </Button>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Header>Todos os Fechamentos</Card.Header>
                        <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {allFechamentos.map(f => (
                                <div key={f.id}>
                                    ID: {f.id} | Aberto: {f.dataAbertura} | Fechado:{' '}
                                    {f.dataFechamento || '---'}
                                </div>
                            ))}
                        </Card.Body>
                    </Card>

                    {fechamentoAberto && (
                        <Card className="mb-4">
                            <Card.Header>Criar Mesa no Fechamento Aberto</Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-2">
                                    <Form.Label>Número da Mesa</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={novaMesaNumero}
                                        onChange={e => setNovaMesaNumero(e.target.value)}
                                    />
                                </Form.Group>
                                <Button onClick={criarMesaNoFechamentoAberto}>Criar Mesa</Button>
                            </Card.Body>
                        </Card>
                    )}

                    {/* NOVO CARD: Cadastro de Cliente */}
                    <Card className="mb-4">
                        <Card.Header>Cadastro de Cliente</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-2">
                                <Form.Label>Nome</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newClient.nome}
                                    onChange={e =>
                                        setNewClient({ ...newClient, nome: e.target.value })
                                    }
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Telefone</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newClient.telefone}
                                    onChange={e =>
                                        setNewClient({ ...newClient, telefone: e.target.value })
                                    }
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Endereço</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newClient.endereco}
                                    onChange={e =>
                                        setNewClient({ ...newClient, endereco: e.target.value })
                                    }
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={newClient.email}
                                    onChange={e =>
                                        setNewClient({ ...newClient, email: e.target.value })
                                    }
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>CPF</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newClient.cpf}
                                    onChange={e =>
                                        setNewClient({ ...newClient, cpf: e.target.value })
                                    }
                                />
                            </Form.Group>
                            <Button onClick={registerCliente}>Cadastrar Cliente</Button>
                        </Card.Body>
                    </Card>

                    {/* NOVO CARD: Lista de Clientes */}
                    <Card className="mb-4">
                        <Card.Header>Lista de Clientes</Card.Header>
                        <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {clientes.map(cli => (
                                <div key={cli.id}>
                                    {cli.nome} - {cli.cpf}
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>

                {/* COLUNA CENTRAL */}
                <Col md={4}>
                    {fechamentoAberto && mesasFechamentoAberto.length > 0 && (
                        <Card className="mb-4">
                            <Card.Header>Mesas do Fechamento Aberto</Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Selecione a Mesa</Form.Label>
                                    <Form.Select value={mesaSelecionada} onChange={handleMesaChange}>
                                        <option value="">-- Selecionar --</option>
                                        {mesasFechamentoAberto.map(m => (
                                            <option key={m.id} value={m.id}>
                                                Mesa {m.numero} (ID: {m.id}) - {m.status}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                {/* Exibe contas relacionadas à mesa selecionada */}
                                {contasDaMesaSelecionada.length > 0 && (
                                    <div
                                        className="mb-3"
                                        style={{ maxHeight: '150px', overflowY: 'auto' }}
                                    >
                                        <strong>Contas da Mesa Selecionada:</strong>
                                        <Table size="sm" striped bordered hover className="mt-2">
                                            <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Status</th>
                                                <th>Total</th>
                                                <th>Abertura</th>
                                                <th>Fechamento</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {contasDaMesaSelecionada.map(c => (
                                                <tr key={c.id}>
                                                    <td>{c.id}</td>
                                                    <td>{c.status}</td>
                                                    <td>
                                                        {c.total ? `R$ ${c.total.toFixed(2)}` : '---'}
                                                    </td>
                                                    <td>
                                                        {c.dataAbertura
                                                            ? new Date(c.dataAbertura).toLocaleString()
                                                            : '---'}
                                                    </td>
                                                    <td>
                                                        {c.dataFechamento
                                                            ? new Date(c.dataFechamento).toLocaleString()
                                                            : '---'}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                {mesaSelecionadaObj && mesaSelecionadaObj.status === 'DISPONIVEL' && (
                                    <>
                                        {/* SELEÇÃO DE CLIENTE PARA ABRIR CONTA */}
                                        <Form.Group className="mb-2">
                                            <Form.Label>Selecione o Cliente</Form.Label>
                                            <Form.Select
                                                value={selectedCliente}
                                                onChange={e => setSelectedCliente(e.target.value)}
                                            >
                                                <option value="">-- Selecione um Cliente --</option>
                                                {clientes.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.nome} - ({c.cpf})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Button onClick={abrirConta}>Abrir Conta</Button>
                                    </>
                                )}

                                {mesaSelecionadaObj && mesaSelecionadaObj.status === 'OCUPADO' && (
                                    <>
                                        {contaFechadaTotal !== null && (
                                            <div className="mt-3">
                                                <p>Total da Conta Fechada: R$ {contaFechadaTotal.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* COLUNA DIREITA */}
                <Col md={4}>
                    {mesaSelecionadaObj && mesaSelecionadaObj.status === 'OCUPADO' && (
                        <>
                            <Card className="mb-4">
                                <Card.Header>Adicionar Itens ao Pedido</Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Produto</Form.Label>
                                        <Form.Select
                                            value={produtoSelecionado}
                                            onChange={e => setProdutoSelecionado(e.target.value)}
                                        >
                                            <option value="">-- Selecione um Produto --</option>
                                            {produtosDisponiveis.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nome} - R$ {p.preco.toFixed(2)}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Quantidade</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            value={quantidadeProduto}
                                            onChange={e => setQuantidadeProduto(Number(e.target.value))}
                                        />
                                    </Form.Group>
                                    <Button className="mb-3" onClick={adicionarItemAoPedido}>
                                        Adicionar ao Pedido
                                    </Button>

                                    {itensPedido.length > 0 && (
                                        <Table striped bordered hover size="sm">
                                            <thead>
                                            <tr>
                                                <th>Produto</th>
                                                <th>Quantidade</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {itensPedido.map((item, idx) => {
                                                const prodObj = produtosDisponiveis.find(p => p.id === item.idProduto);
                                                return (
                                                    <tr key={idx}>
                                                        <td>{prodObj ? prodObj.nome : 'Produto não encontrado'}</td>
                                                        <td>{item.quantidade}</td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </Table>

                                    )}

                                    <Button
                                        variant="success"
                                        onClick={criarPedido}
                                        disabled={itensPedido.length === 0}
                                    >
                                        Criar Pedido
                                    </Button>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Header>Fechar Conta</Card.Header>
                                <Card.Body>
                                    <Button variant="danger" onClick={fecharConta}>
                                        Fechar Conta
                                    </Button>
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default App;
