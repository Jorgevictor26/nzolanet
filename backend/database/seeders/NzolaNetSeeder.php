<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class NzolaNetSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------------------
        // 1. UTILIZADORES
        // ---------------------------------------------------------------
        $users = [
            [
                'name'          => 'Ana Beatriz Santos',
                'username'      => 'anabeatriz',
                'email'         => 'ana.santos@email.com',
                'phone_number'  => '+244 923 111 001',
                'password'      => Hash::make('Ana@12345'),
                'bio'           => 'Professora de matemática 📐 | Amo viajar e descobrir novos sabores 🌍',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Carlos Eduardo Mendes',
                'username'      => 'carlosmendes',
                'email'         => 'carlos.mendes@email.com',
                'phone_number'  => '+244 923 111 002',
                'password'      => Hash::make('Carlos@12345'),
                'bio'           => 'Engenheiro civil 🏗️ | Pai orgulhoso | Fã de futebol 🏟️',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Fernanda Oliveira',
                'username'      => 'fer_oliveira',
                'email'         => 'fernanda.oliveira@email.com',
                'phone_number'  => '+244 923 111 003',
                'password'      => Hash::make('Fernanda@12345'),
                'bio'           => 'Nutricionista 🥗 | Partilhando dicas de saúde e bem-estar diariamente',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'João Paulo Ferreira',
                'username'      => 'joaopaulo_f',
                'email'         => 'joao.ferreira@email.com',
                'phone_number'  => '+244 923 111 004',
                'password'      => Hash::make('Joao@12345'),
                'bio'           => 'Fotógrafo 📷 | Capturo momentos que contam histórias',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Mariana Costa',
                'username'      => 'mari_costa',
                'email'         => 'mariana.costa@email.com',
                'phone_number'  => '+244 923 111 005',
                'password'      => Hash::make('Mariana@12345'),
                'bio'           => 'Designer gráfica ✏️ | Amante de arte e cultura angolana',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Pedro Alves Neto',
                'username'      => 'pedro_neto',
                'email'         => 'pedro.neto@email.com',
                'phone_number'  => '+244 923 111 006',
                'password'      => Hash::make('Pedro@12345'),
                'bio'           => 'Estudante de Direito ⚖️ | Activista social | Música afro-beat 🎵',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Luísa Teixeira',
                'username'      => 'luisa.teixeira',
                'email'         => 'luisa.teixeira@email.com',
                'phone_number'  => '+244 923 111 007',
                'password'      => Hash::make('Luisa@12345'),
                'bio'           => 'Médica 👩‍⚕️ | Saúde pública e comunidade | Mãe de gémeos',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Ricardo Sousa',
                'username'      => 'ricardosousa',
                'email'         => 'ricardo.sousa@email.com',
                'phone_number'  => '+244 923 111 008',
                'password'      => Hash::make('Ricardo@12345'),
                'bio'           => 'Empreendedor 🚀 | CEO da StartupLuanda | Inovação e tecnologia',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Tatiana Lopes',
                'username'      => 'tati_lopes',
                'email'         => 'tatiana.lopes@email.com',
                'phone_number'  => '+244 923 111 009',
                'password'      => Hash::make('Tatiana@12345'),
                'bio'           => 'Cozinheira profissional 👩‍🍳 | Receitas da avó com toque moderno',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Miguel Barbosa',
                'username'      => 'miguel_b',
                'email'         => 'miguel.barbosa@email.com',
                'phone_number'  => '+244 923 111 010',
                'password'      => Hash::make('Miguel@12345'),
                'bio'           => 'Professor universitário 🎓 | Filosofia e ciências sociais | Escritor nas horas vagas',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Sofia Nascimento',
                'username'      => 'sofia_nasc',
                'email'         => 'sofia.nascimento@email.com',
                'phone_number'  => '+244 923 111 011',
                'password'      => Hash::make('Sofia@12345'),
                'bio'           => 'Advogada 👩‍⚖️ | Direitos humanos | Viagens e livros',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Bruno Cardoso',
                'username'      => 'brunocardoso',
                'email'         => 'bruno.cardoso@email.com',
                'phone_number'  => '+244 923 111 012',
                'password'      => Hash::make('Bruno@12345'),
                'bio'           => 'Músico 🎸 | Banda "Ritmos de Luanda" | Produção musical',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Cláudia Moreira',
                'username'      => 'claudia_m',
                'email'         => 'claudia.moreira@email.com',
                'phone_number'  => '+244 923 111 013',
                'password'      => Hash::make('Claudia@12345'),
                'bio'           => 'Jornalista 📰 | Cobro política e sociedade | Podcast "Vozes de Angola"',
                'privacy'       => 'public',
            ],
            [
                'name'          => 'Hélder Pinto',
                'username'      => 'helder_pinto',
                'email'         => 'helder.pinto@email.com',
                'phone_number'  => '+244 923 111 014',
                'password'      => Hash::make('Helder@12345'),
                'bio'           => 'Arquitecto 🏛️ | Urbanismo sustentável | Pai e marido feliz',
                'privacy'       => 'private',
            ],
            [
                'name'          => 'Vanessa Rodrigues',
                'username'      => 'vanessa_rod',
                'email'         => 'vanessa.rodrigues@email.com',
                'phone_number'  => '+244 923 111 015',
                'password'      => Hash::make('Vanessa@12345'),
                'bio'           => 'Influenciadora de moda 👗 | Estilo africano moderno | Colaborações abertas',
                'privacy'       => 'public',
            ],
        ];

        $createdUsers = [];
        foreach ($users as $userData) {
            $createdUsers[] = User::create($userData);
        }

        // ---------------------------------------------------------------
        // 2. POSTS
        // ---------------------------------------------------------------
        $posts = [
            // Ana
            ['user' => 0, 'content' => 'Mais um dia de aulas incríveis! Os meus alunos do 10º ano resolveram um problema de geometria que eu achei que iria levar uma semana. Orgulho enorme! 🎉📐'],
            ['user' => 0, 'content' => 'Fim de semana em Benguela com a família. A cidade tem uma energia única que sempre me carrega de inspiração. Alguém mais ama esta cidade tanto quanto eu? 🌊'],

            // Carlos
            ['user' => 1, 'content' => 'Projecto de construção do novo complexo habitacional em Talatona está a avançar bem. Mais 200 famílias vão ter casa condigna até ao final do ano. Trabalho que vale a pena! 🏗️'],
            ['user' => 1, 'content' => 'O Petro de Luanda ganhou mais uma vez! Que jogo espectacular. Orgulho angolano dentro e fora de campo. 🏆⚽'],

            // Fernanda
            ['user' => 2, 'content' => 'Dica rápida de nutrição: substituir o arroz branco por arroz integral nas refeições principais reduz o índice glicémico e mantém a saciedade por mais tempo. Pequenas mudanças, grandes resultados! 🥗'],
            ['user' => 2, 'content' => 'Hoje no consultório tive uma paciente que perdeu 12kg em 4 meses apenas ajustando a alimentação, sem nenhuma dieta maluca. A ciência da nutrição funciona quando aplicada correctamente. 💪'],

            // João Paulo
            ['user' => 3, 'content' => 'Sessão fotográfica ao nascer do sol na Ilha de Luanda. Há momentos que nenhuma câmara consegue capturar na perfeição, mas esta manhã chegámos perto. 📷✨'],
            ['user' => 3, 'content' => 'Para todos os fotógrafos iniciantes: a melhor câmara é aquela que tens contigo. Já produzi trabalhos incríveis só com o telemóvel. O olho é a ferramenta mais importante.'],

            // Mariana
            ['user' => 4, 'content' => 'Acabei de entregar o branding completo para uma startup de tecnologia angolana. Ver as cores, tipografia e identidade visual que concebi ganhar vida num produto real é a melhor sensação do mundo! ✏️🎨'],
            ['user' => 4, 'content' => 'A arte urbana de Luanda merece muito mais reconhecimento internacional. Temos artistas incríveis que pintam as paredes desta cidade com histórias que o mundo precisa de ouvir.'],

            // Pedro
            ['user' => 5, 'content' => 'Estudo publicado hoje confirma: países com maior investimento em educação jurídica têm sistemas judiciais mais eficientes. Angola está no caminho certo com as reformas actuais. ⚖️'],
            ['user' => 5, 'content' => 'Evento de activismo estudantil na Faculdade de Direito hoje. Mais de 300 jovens a debater os seus direitos e deveres cívicos. O futuro do país está bem entregue! 🌟'],

            // Luísa
            ['user' => 6, 'content' => 'Campanha de vacinação no Sambizanga esta semana. A comunidade respondeu muito bem, superámos a meta em 40%. Saúde pública é trabalho de todos! 👩‍⚕️💉'],
            ['user' => 6, 'content' => 'Os meus gémeos completaram 3 anos hoje! Há 3 anos atrás estava em trabalho de parto enquanto ainda respondia mensagens dos pacientes. A vida de médica-mãe não é fácil mas é incrível. 🎂❤️'],

            // Ricardo
            ['user' => 7, 'content' => 'A StartupLuanda acaba de fechar uma ronda de investimento de 500 mil dólares! Prova de que o ecossistema empreendedor angolano está a crescer e a atrair atenção internacional. 🚀'],
            ['user' => 7, 'content' => 'Conselho para jovens empreendedores: falhar faz parte. Das minhas 3 empresas, 2 falharam antes desta ter sucesso. A resiliência é a competência mais importante de um empreendedor.'],

            // Tatiana
            ['user' => 8, 'content' => 'Receita da semana: Moamba de galinha com funge, como a minha avó fazia no Huambo. Guardar estas receitas é guardar memória e identidade. Quem quiser a receita completa, é só pedir! 👩‍🍳🍲'],
            ['user' => 8, 'content' => 'Participei hoje num workshop de culinária internacional em Luanda. Aprendi técnicas francesas que vou adaptar para os ingredientes locais. A fusão é o futuro da gastronomia angolana!'],

            // Miguel
            ['user' => 9, 'content' => 'Novo artigo publicado sobre a influência da filosofia Ubuntu no direito comunitário africano. Link na bio para quem quiser ler. O pensamento africano tem muito a ensinar ao mundo. 🎓📚'],
            ['user' => 9, 'content' => 'Debate filosófico com os alunos hoje sobre livre-arbítrio e responsabilidade social. Quando um aluno diz "professor, nunca tinha pensado assim" — é por momentos como este que amo ensinar.'],

            // Sofia
            ['user' => 10, 'content' => 'Caso encerrado com sucesso! Uma família que perdeu a casa por documentação fraudulenta recuperou o seu bem após 2 anos de luta judicial. Isto é o direito a servir as pessoas. ⚖️'],
            ['user' => 10, 'content' => 'Semana de leituras: "O Mundo Até Ontem" do Jared Diamond e "Mayombe" do Pepetela. Combinar perspectivas globais com literatura angolana é o meu programa de fim de semana perfeito. 📖'],

            // Bruno
            ['user' => 11, 'content' => 'Novo single dos Ritmos de Luanda já disponível em todas as plataformas! "Kizomba do Futuro" mistura semba tradicional com produção electrónica moderna. Digam-me o que acham! 🎸🎵'],
            ['user' => 11, 'content' => 'Ensaio de 6 horas hoje. Os dedos doem mas a música que estamos a criar compensa tudo. Concerto em Luanda no próximo mês — quem vem?'],

            // Cláudia
            ['user' => 12, 'content' => 'Episódio 47 do podcast "Vozes de Angola" já disponível. Desta vez entrevistei três mulheres empresárias do interior do país. Histórias que inspiram e que raramente chegam às grandes cidades. 🎙️'],
            ['user' => 12, 'content' => 'Cobertura jornalística da conferência da SADC em Luanda. Angola está a afirmar-se como voz importante na política regional africana. Tempos interessantes para cobrir! 📰'],

            // Hélder (privado mas tem posts)
            ['user' => 13, 'content' => 'Projecto de requalificação urbana do centro histórico de Luanda aprovado pela câmara municipal. 5 anos de trabalho a ganhar forma. A memória arquitectónica da cidade vai ser preservada. 🏛️'],

            // Vanessa
            ['user' => 14, 'content' => 'Look da semana: capulana portuguesa com corte ocidental moderno. Quando a tradição encontra a contemporaneidade, a moda angolana mostra porque é única no mundo! 👗✨'],
            ['user' => 14, 'content' => 'Parceria confirmada com a marca local "Ngola Styles" para uma colecção cápsula de Verão. Muito orgulhosa de colaborar com talento angolano. Em breve mais detalhes! 🛍️'],
        ];

        $createdPosts = [];
        foreach ($posts as $postData) {
            $createdPosts[] = Post::create([
                'user_id' => $createdUsers[$postData['user']]->id,
                'content' => $postData['content'],
            ]);
        }

        // ---------------------------------------------------------------
        // 3. FOLLOWS (relações realistas entre utilizadores)
        // ---------------------------------------------------------------
        $followPairs = [
            [0, 1], [0, 2], [0, 4], [0, 9],
            [1, 0], [1, 3], [1, 7], [1, 11],
            [2, 0], [2, 6], [2, 8], [2, 14],
            [3, 0], [3, 4], [3, 10], [3, 14],
            [4, 2], [4, 3], [4, 11], [4, 14],
            [5, 9], [5, 6], [5, 10], [5, 12],
            [6, 2], [6, 0], [6, 7], [6, 13],
            [7, 1], [7, 5], [7, 8], [7, 12],
            [8, 2], [8, 4], [8, 9], [8, 14],
            [9, 5], [9, 10], [9, 12], [9, 0],
            [10, 5], [10, 9], [10, 12], [10, 6],
            [11, 3], [11, 4], [11, 7], [11, 14],
            [12, 5], [12, 9], [12, 10], [12, 13],
            [13, 1], [13, 6], [13, 7], [13, 9],
            [14, 2], [14, 3], [14, 4], [14, 11],
        ];

        foreach ($followPairs as [$follower, $following]) {
            Follow::firstOrCreate([
                'follower_id'  => $createdUsers[$follower]->id,
                'following_id' => $createdUsers[$following]->id,
            ]);
        }

        // ---------------------------------------------------------------
        // 4. LIKES em posts
        // ---------------------------------------------------------------
        $likePairs = [
            [1, 0], [2, 0], [4, 0], [6, 0], [9, 0],
            [0, 2], [3, 2], [5, 2], [7, 2],
            [0, 4], [1, 4], [2, 4], [8, 4], [11, 4],
            [0, 6], [2, 6], [4, 6], [9, 6],
            [1, 8], [3, 8], [4, 8], [14, 8],
            [0, 10], [5, 10], [7, 10], [12, 10],
            [2, 12], [3, 12], [6, 12],
            [0, 14], [1, 14], [3, 14], [4, 14], [8, 14], [11, 14],
            [5, 18], [7, 18], [9, 18], [10, 18],
            [0, 22], [4, 22], [8, 22], [14, 22],
            [1, 24], [3, 24], [7, 24], [11, 24],
            [0, 28], [2, 28], [6, 28], [9, 28], [13, 28],
        ];

        foreach ($likePairs as [$userIdx, $postIdx]) {
            if (isset($createdPosts[$postIdx])) {
                Like::firstOrCreate([
                    'user_id' => $createdUsers[$userIdx]->id,
                    'post_id' => $createdPosts[$postIdx]->id,
                ]);
            }
        }

        // ---------------------------------------------------------------
        // 5. COMENTÁRIOS
        // ---------------------------------------------------------------
        $comments = [
            ['user' => 1, 'post' => 0,  'content' => 'Que orgulho! Os alunos de hoje surpreendem sempre. Parabéns Ana!'],
            ['user' => 4, 'post' => 0,  'content' => 'Professoras como tu fazem a diferença. ❤️'],
            ['user' => 2, 'post' => 2,  'content' => 'Que projecto incrível Carlos! Habitação digna para todos é um direito básico.'],
            ['user' => 7, 'post' => 2,  'content' => 'Parceria com a StartupLuanda para soluções sustentáveis no projecto? Seria interessante conversar!'],
            ['user' => 0, 'post' => 4,  'content' => 'Vou experimentar essa dica! Obrigada Fernanda 🥗'],
            ['user' => 6, 'post' => 4,  'content' => 'Confirmado pela ciência médica também. Excelente conselho!'],
            ['user' => 4, 'post' => 6,  'content' => 'Que foto maravilhosa João! A Ilha ao amanhecer é mesmo única.'],
            ['user' => 14, 'post' => 6, 'content' => 'Preciso de te contratar para uma sessão de moda! 🙌'],
            ['user' => 3, 'post' => 8,  'content' => 'Adoro ver trabalho angolano a crescer! Partilha o portfólio?'],
            ['user' => 11, 'post' => 8, 'content' => 'Precisamos de um rebranding para a banda. Podemos falar? 😄'],
            ['user' => 9, 'post' => 10, 'content' => 'Completamente de acordo. A educação jurídica é base da cidadania.'],
            ['user' => 5, 'post' => 12, 'content' => 'Trabalho fantástico Dra. Luísa! A saúde pública precisa de mais pessoas como você.'],
            ['user' => 0, 'post' => 12, 'content' => 'Que notícia maravilhosa! Parabéns à equipa toda!'],
            ['user' => 1, 'post' => 14, 'content' => 'Parabéns Ricardo! Angola precisa de mais histórias de sucesso assim!'],
            ['user' => 5, 'post' => 14, 'content' => 'Inspirador! Quando há espaço para jovens empreendedores na vossa equipa?'],
            ['user' => 0, 'post' => 16, 'content' => 'Quero a receita completa por favor!! 🍲'],
            ['user' => 2, 'post' => 16, 'content' => 'A moamba da avó é sempre a melhor. Que saudades!'],
            ['user' => 6, 'post' => 16, 'content' => 'Receita saudável e culturalmente rica. Perfeito!'],
            ['user' => 5, 'post' => 18, 'content' => 'Vou procurar o artigo! Sempre fui fascinado pela filosofia Ubuntu.'],
            ['user' => 10, 'post' => 18, 'content' => 'Ubuntu como base jurídica é um campo tão rico. Adorava ler!'],
            ['user' => 11, 'post' => 22, 'content' => 'Já ouvi e está incrível!! Kizomba do Futuro é o tema do Verão 🎵'],
            ['user' => 4, 'post' => 22, 'content' => 'A capa do single ficou linda também! 🎨'],
            ['user' => 7, 'post' => 24, 'content' => 'Episódio fantástico Cláudia! Partilhei com toda a minha rede.'],
            ['user' => 9, 'post' => 24, 'content' => 'Essas histórias do interior são exactamente o que a comunicação angolana precisa de mostrar mais.'],
            ['user' => 3, 'post' => 28, 'content' => 'Que look incrível Vanessa! A capulana nunca sai de moda 👗'],
            ['user' => 4, 'post' => 28, 'content' => 'A identidade visual desta combinação é perfeita. Parabéns!'],
            ['user' => 8, 'post' => 28, 'content' => 'Próxima colecção com inspiração na culinária angolana? 😄'],
        ];

        foreach ($comments as $commentData) {
            if (isset($createdPosts[$commentData['post']])) {
                Comment::create([
                    'user_id' => $createdUsers[$commentData['user']]->id,
                    'post_id' => $createdPosts[$commentData['post']]->id,
                    'content' => $commentData['content'],
                ]);
            }
        }

        $this->command->info('');
        $this->command->info('✅ NzolaNet seed concluído com sucesso!');
        $this->command->info('');
        $this->command->info(str_pad('', 80, '-'));
        $this->command->info(str_pad('UTILIZADOR', 22) . str_pad('EMAIL', 36) . 'PASSWORD');
        $this->command->info(str_pad('', 80, '-'));

        foreach ($users as $u) {
            $plainPassword = match ($u['username']) {
                'anabeatriz'     => 'Ana@12345',
                'carlosmendes'   => 'Carlos@12345',
                'fer_oliveira'   => 'Fernanda@12345',
                'joaopaulo_f'    => 'Joao@12345',
                'mari_costa'     => 'Mariana@12345',
                'pedro_neto'     => 'Pedro@12345',
                'luisa.teixeira' => 'Luisa@12345',
                'ricardosousa'   => 'Ricardo@12345',
                'tati_lopes'     => 'Tatiana@12345',
                'miguel_b'       => 'Miguel@12345',
                'sofia_nasc'     => 'Sofia@12345',
                'brunocardoso'   => 'Bruno@12345',
                'claudia_m'      => 'Claudia@12345',
                'helder_pinto'   => 'Helder@12345',
                'vanessa_rod'    => 'Vanessa@12345',
                default          => '—',
            };
            $this->command->info(
                str_pad($u['name'], 22) .
                str_pad($u['email'], 36) .
                $plainPassword
            );
        }

        $this->command->info(str_pad('', 80, '-'));
        $this->command->info('');
        $this->command->info('📌 Nota: Hélder Pinto tem perfil PRIVADO.');
        $this->command->info('📊 Criados: 15 utilizadores | ' . count($createdPosts) . ' posts | ' . count($followPairs) . ' follows | comentários e likes.');
        $this->command->info('');
    }
}
