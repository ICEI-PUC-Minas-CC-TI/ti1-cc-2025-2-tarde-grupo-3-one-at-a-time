$(document).ready(function() {
    
    // URL da sua nova API
    const API_URL = 'http://localhost:3000/eventos';

    // Variável global para guardar os eventos (nosso "estado local")
    let events = [];

    // --- FUNÇÃO PRINCIPAL: Renderizar Eventos ---
    // (Esta função não muda muito, mas agora depende da var 'events' global)
    function renderCalendar() {

        // 1. Limpa eventos antigos
        $('.event-marker').remove();

        // 2. Itera sobre cada evento salvo
        events.forEach(function(event) {
            
            // 3. Verifica se o evento pertence a Outubro 2025
            // (Assumindo que 'event.data' está no formato 'YYYY-MM-DD')
            if (!event.data.startsWith('2025-10')) {

                return; // Pula este evento

            }

            // 4. Extrai o dia
            const day = parseInt(event.data.split('-')[2], 10).toString();

            // 5. Encontra a célula (<td>) correspondente
            $('tbody td').each(function() {

                if ($(this).text() === day) {
                    
                    // 6. Cria o HTML para o evento
                    const eventHtml = `
                        <div class="event-marker" data-id="${event.id}" title="Tipo: ${event.tipo}\nDescrição: ${event.descricao}" style="display: flex; flex-direction: column;">
                            <span class="event-name mb-3">${event.nome}</span>
                            <div class="event-buttons" style="display: flex; gap: 0.5rem">
                                <button class="btn btn-sm btn-warning edit-btn py-1 px-2" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                                <button class="btn btn-sm btn-danger delete-btn py-1 px-2" title="Deletar"><i class="bi bi-x-lg"></i></button>
                            </div>
                        </div>
                    `;
                    
                    // 7. Adiciona o evento à célula
                    $(this).append(eventHtml);
                }

            });

        });

    }

    // --- READ (Buscar e Renderizar Eventos) ---
    // Nova função para buscar dados da API
    function fetchAndRenderEvents() {

        $.ajax({

            url: API_URL,
            type: 'GET',
            dataType: 'json'

        })

        .done(function(data) {

            // 1. Atualiza nossa variável local
            events = data; 

            // 2. Renderiza o calendário com os novos dados
            renderCalendar();

        })

        .fail(function() {

            alert('Erro ao carregar eventos. Verifique se o json-server está rodando.');

        });

    }

    // --- CREATE (Adicionar Evento) ---
    $('form').on('submit', function(e) {

        e.preventDefault();
        const $form = $(this);

        const eventName = $('#eventName').val();
        const eventDate = $('#eventDate').val(); // Formato: 'YYYY-MM-DD'

        if (!eventName || !eventDate) {

            alert('Por favor, preencha o nome e a data do evento.');
            return;

        }

        const newEvent = {

            usuarioID: 99, // Valor padrão
            nome: eventName,
            descricao: "Novo evento adicionado pelo formulário.",
            tipo: "indefinido",
            data: eventDate 

        };

        // Requisição POST para criar
        $.ajax({

            url: API_URL,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newEvent) // Envia o objeto como texto JSON

        })

        .done(function() {

            // Sucesso: busca os dados atualizados do servidor e limpa o form
            fetchAndRenderEvents();
            $form[0].reset();

        })

        .fail(function() {

            alert('Erro ao salvar o evento.');

        });

    });

    // --- DELETE (Deletar Evento) ---
    $('tbody').on('click', '.delete-btn', function() {

        if (!confirm('Tem certeza que deseja deletar este evento?')) {

            return;

        }

        const eventId = $(this).closest('.event-marker').data('id');
        
        // Requisição DELETE
        $.ajax({

            url: `${API_URL}/${eventId}`, // Ex: http://localhost:3000/eventos/3
            type: 'DELETE'

        })

        .done(function() {

            // Sucesso: busca os dados atualizados
            fetchAndRenderEvents();

        })

        .fail(function() {

            alert('Erro ao deletar o evento.');

        });

    });

    // --- UPDATE (Editar Evento) ---
    $('tbody').on('click', '.edit-btn', function() {

        const eventId = $(this).closest('.event-marker').data('id');
        
        // Encontra o evento na nossa variável local 'events'
        const eventToEdit = events.find(event => event.id == eventId);
        if (!eventToEdit) return;

        const newName = prompt('Digite o novo nome para o evento:', eventToEdit.nome);

        if (newName && newName.trim() !== '') {

            // Cria um objeto atualizado
            const updatedEvent = {
                ...eventToEdit, // Copia todos os campos antigos
                nome: newName.trim() // Sobrescreve o nome

            };

            // Requisição PUT para atualizar
            $.ajax({

                url: `${API_URL}/${eventId}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(updatedEvent)

            })

            .done(function() {

                // Sucesso: busca os dados atualizados
                fetchAndRenderEvents();

            })

            .fail(function() {

                alert('Erro ao atualizar o evento.');

            });

        }

    });

    // --- CARGA INICIAL ---
    // Busca os eventos pela primeira vez
    fetchAndRenderEvents();
    
});