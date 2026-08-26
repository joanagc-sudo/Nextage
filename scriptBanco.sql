
drop database if exists nextage;
CREATE DATABASE IF NOT EXISTS nextage;
USE nextage;
CREATE TABLE Usuarios_Administradores_Estudantes (
id_usuario INT PRIMARY KEY NOT NULL,
nome VARCHAR(1000) NOT NULL,
email VARCHAR(100) NOT NULL,
senha VARCHAR(10) NOT NULL,
data_nascimento date NOT NULL,
tipo_usuario INT NOT NULL);
CREATE TABLE Disciplinas (
id_disciplina INT PRIMARY KEY NOT NULL,
nome VARCHAR(100) NOT NULL);
CREATE TABLE Vestibulares (
id_vestibular INT PRIMARY KEY NOT NULL,
edicao INT NOT NULL,
nome VARCHAR(100) NOT NULL,
banca INT NOT NULL,
ano YEAR NOT NULL);
CREATE TABLE Conteudos (
id_conteudo INT PRIMARY KEY NOT NULL,
id_disciplina INT NOT NULL,
nome VARCHAR(100) NOT NULL,
FOREIGN KEY (id_disciplina) REFERENCES Disciplinas(id_disciplina));
CREATE TABLE Questoes (
id_questao INT PRIMARY KEY NOT NULL,
id_vestibular INT NOT NULL,
explicacao VARCHAR(2000) NOT NULL,
enunciado VARCHAR(3000) NOT NULL,
resposta_correta INT NOT NULL,
FOREIGN KEY (id_vestibular) REFERENCES Vestibulares(id_vestibular));
CREATE TABLE Topicos_forum (
id_topico INT PRIMARY KEY NOT NULL,
id_usuario INT NOT NULL,
titulo VARCHAR(200) NOT NULL,
descricao VARCHAR(2000) NOT NULL,
data_publicacao DATE NOT NULL,
FOREIGN KEY (id_usuario) REFERENCES
Usuarios_Administradores_Estudantes(id_usuario));
CREATE TABLE Materiais (
id_material INT PRIMARY KEY NOT NULL,
id_usuario INT NOT NULL,
titulo VARCHAR(200) NOT NULL,
data_publicacao DATE NOT NULL,
autor VARCHAR(300) NOT NULL,
aprovado_publicacao BOOLEAN NOT NULL,
descricao VARCHAR(500) NOT NULL,
FOREIGN KEY (id_usuario) REFERENCES
Usuarios_Administradores_Estudantes(id_usuario));
CREATE TABLE Relatorio_desempenho (
id_relatorio INT PRIMARY KEY NOT NULL,
id_usuario INT NOT NULL,
horas_estudadas TIME NOT NULL,
total_erros INT NOT NULL,
total_acertos INT NOT NULL,
FOREIGN KEY (id_usuario) REFERENCES
Usuarios_Administradores_Estudantes(id_usuario));
CREATE TABLE Cronometros (
id_cronometro INT PRIMARY KEY NOT NULL,
id_usuario INT NOT NULL,
data DATE NOT NULL,
tempo_estudado TIME NOT NULL,
FOREIGN KEY (id_usuario) REFERENCES
Usuarios_Administradores_Estudantes(id_usuario));
CREATE TABLE Cronograma_estudos (
id_cronograma INT PRIMARY KEY NOT NULL,
id_usuario INT NOT NULL,
domingo VARCHAR(1000) NOT NULL,
segunda VARCHAR(1000) NOT NULL,
terca VARCHAR(1000) NOT NULL,
quarta VARCHAR(1000) NOT NULL,
quinta VARCHAR(1000) NOT NULL,
sexta VARCHAR(1000) NOT NULL,
sabado VARCHAR(1000) NOT NULL,
FOREIGN KEY (id_usuario) REFERENCES
Usuarios_Administradores_Estudantes(id_usuario));
CREATE TABLE Responder (
id_usuario INT NOT NULL,
id_questao INT NOT NULL,
data DATE NOT NULL,
certo BOOLEAN NOT NULL,
PRIMARY KEY (id_usuario, id_questao),
FOREIGN KEY (id_usuario) REFERENCES
Usuarios_Administradores_Estudantes(id_usuario),
FOREIGN KEY (id_questao) REFERENCES Questoes(id_questao));
CREATE TABLE Questoes_Conteudos (
id_questao INT NOT NULL,
id_conteudo INT NOT NULL,
PRIMARY KEY (id_questao, id_conteudo),
FOREIGN KEY (id_questao) REFERENCES Questoes(id_questao),
FOREIGN KEY (id_conteudo) REFERENCES Conteudos(id_conteudo));
CREATE TABLE Conteudo_Material (
id_conteudo INT NOT NULL,
id_material INT NOT NULL,
PRIMARY KEY (id_conteudo, id_material),
FOREIGN KEY (id_conteudo) REFERENCES Conteudos(id_conteudo),
FOREIGN KEY (id_material) REFERENCES Materiais(id_material));
CREATE TABLE Conteudos_TopicosForum (
id_topico INT NOT NULL,
id_conteudo INT NOT NULL,
PRIMARY KEY (id_topico, id_conteudo),
FOREIGN KEY (id_topico) REFERENCES Topicos_forum(id_topico),
FOREIGN KEY (id_conteudo) REFERENCES Conteudos(id_conteudo));
INSERT INTO Usuarios_Administradores_Estudantes(
id_usuario, nome, email, senha, tipo_usuario)
VALUES (1, 'João Silva', 'joao@email.com', '123456', 1),
(2, 'Maria Souza', 'maria@email.com', '654321', 2),
(3, 'Carlos Lima', 'carlos@email.com', 'abcdef', 3);
INSERT INTO Disciplinas (
id_disciplina, nome)
VALUES (1, 'Matemática'),
(2, 'Português'),
(3, 'Biologia');
INSERT INTO Vestibulares (
id_vestibular, edicao, nome, banca, ano)
VALUES (1, 1, 'ENEM', 1, 2023),
(2, 2, 'FUVEST', 2, 2024),
(3, 1, 'UNICAMP', 3, 2025);
INSERT INTO Conteudos (
id_conteudo, id_disciplina, nome)
VALUES (1, 1, 'Funções'),
(2, 2, 'Interpretação de Texto'),
(3, 3, 'Genética');
INSERT INTO Questoes
(id_questao, id_vestibular, explicacao, enunciado, resposta_correta)
VALUES (1, 1, 'Aplicação de função afim.', 'Qual é o valor de f(2)?', 2),
(2, 2, 'Interpretação textual.', 'Leia o texto e responda.', 1),
(3, 3, 'Conceitos básicos de genética.', 'O que é um gene?', 3);
INSERT INTO Topicos_forum (
id_topico, id_usuario, titulo, descricao, data_publicacao)
VALUES (1, 1, 'Dúvida sobre funções', 'Como resolver funções do 1º grau?', '2025-05-01'),
(2, 2, 'Interpretação', 'Alguém pode explicar esta questão?', '2025-05-02'),
(3, 3, 'Genética', 'Material para estudar genética.', '2025-05-03');
INSERT INTO Materiais(
id_material, id_usuario, titulo, data_publicacao, autor, aprovado_publicacao, descricao)
VALUES (1, 1, 'Resumo de Funções', '2025-05-05', 'João Silva', TRUE, 'Resumo completo
de funções.'),
(2, 2, 'Gramática Básica', '2025-05-06', 'Maria Souza', TRUE, 'Material sobre gramática.'),
(3, 3, 'Mapa Mental Genética', '2025-05-07', 'Carlos Lima', FALSE, 'Mapa mental para
revisão.');
INSERT INTO Relatorio_desempenho (
id_relatorio, id_usuario, horas_estudadas, total_erros, total_acertos)
VALUES (1, 1, '02:30:00', 5, 20),
(2, 2, '01:45:00', 3, 18),
(3, 3, '03:00:00', 8, 25);
INSERT INTO Cronometros (
id_cronometro, id_usuario, data, tempo_estudado)
VALUES (1, 1, '2025-05-10', '01:30:00'),
(2, 2, '2025-05-10', '02:00:00'),
(3, 3, '2025-05-10', '01:15:00');
INSERT INTO Cronograma_estudos (
id_cronograma, id_usuario, domingo, segunda, terca, quarta, quinta, sexta, sabado)
VALUES (1, 1, 'Descanso', 'Matemática', 'Português', 'Biologia', 'História', 'Química',
'Revisão'),
(2, 2, 'Redação', 'Biologia', 'Matemática', 'Geografia', 'Português', 'Física', 'Simulados'),
(3, 3, 'Química', 'História', 'Matemática', 'Português', 'Biologia', 'Redação', 'Descanso');
INSERT INTO Responder (
id_usuario, id_questao, data, certo)
VALUES (1, 1, '2025-05-11', TRUE),
(2, 2, '2025-05-11', FALSE),
(3, 3, '2025-05-11', TRUE);
INSERT INTO Questoes_Conteudos (
id_questao, id_conteudo)
VALUES (1, 1), (2, 2), (3, 3);
INSERT INTO Conteudo_Material
(id_conteudo, id_material)
VALUES (1, 1), (2, 2), (3, 3);
INSERT INTO Conteudos_TopicosForum
(id_topico, id_conteudo)
VALUES (1, 1), (2, 2), (3, 3);