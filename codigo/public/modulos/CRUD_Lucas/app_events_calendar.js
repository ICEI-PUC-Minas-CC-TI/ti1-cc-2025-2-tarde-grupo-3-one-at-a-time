$(document).ready(function() {
    
    const API_URL = 'http://localhost:3000/eventos';
    let calendar;

    // Função auxiliar para fechar o painel de detalhes
    function closeDetailsPanel() {
        $('#eventDetailsPanel').hide();
    }

    // FUNÇÃO PARA ABRIR O PAINEL FLUTUANTE E MOSTRAR DADOS
    function handleEventAction(info) {
        
        // Esconde qualquer painel aberto
        closeDetailsPanel(); 
        
        // Obtém os dados do evento
        const eventId = info.event.id;
        const originalEventData = info.event.extendedProps; 
        const eventDate = info.event.startStr.split('T')[0];

        // Mostra o painel com os dados
        $('#panelEventName').text(originalEventData.nome);
        $('#panelEventDate').text(eventDate);
        $('#panelEventType').text(originalEventData.tipo);
        $('#panelEventDescription').text(originalEventData.descricao);
        $('#panelEventId').val(eventId); // Guarda o ID
        
        // Posiciona o painel
        const eventElement = $(info.el);
        const calendarContainer = $('.calendar');
        
        // Calcula a posição para aparecer abaixo/ao lado do evento
        const position = eventElement.offset();
        const calendarOffset = calendarContainer.offset();
        
        // Define a posição absoluta dentro do container 'calendar'
        $('#eventDetailsPanel').css({
            top: position.top - calendarOffset.top + eventElement.outerHeight() + 5,
            left: position.left - calendarOffset.left
        }).show();
        
        // Impede que o clique no evento ative a navegação padrão do FullCalendar
        info.jsEvent.stopPropagation(); 
    }


    // FUNÇÃO PRINCIPAL: Inicializar FullCalendar 
    function initializeCalendar() {
        const calendarEl = document.getElementById('fullcalendar');
        calendar = new FullCalendar.Calendar(calendarEl, {

            // Configurações de UI
            initialView: 'dayGridMonth', 
            locale: 'pt-br', 
            headerToolbar: {
                left: 'title',
                right: 'prev,next today'
            },
            
            timeZone: 'local',
            editable: true, 
            
            // eventClick chama a função que abre o painel flutuante
            eventClick: handleEventAction, 
            
            // Configuração READ
            events: {
                url: API_URL,
                method: 'GET',
                failure: function() {
                    alert('Erro ao carregar eventos. Verifique se o json-server está rodando.');
                },
                eventDataTransform: function(eventData) {
                    return {
                        id: eventData.id,
                        title: eventData.nome, 
                        start: eventData.data,
                        extendedProps: eventData
                    };
                }
            },
        });

        calendar.render();
    }
    
    // LÓGICA DE FECHAR PAINEL (Botão "X" e clique fora)
    $('#closePanelBtn').on('click', closeDetailsPanel);
    
    // Fecha o painel se clicar fora dele ou fora do próprio calendário
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.calendar').length && 
            !$(e.target).closest('#eventDetailsPanel').length) {
            closeDetailsPanel();
        }
    });


    // LÓGICA DE EDIÇÃO (Botão no Painel)
    $('#panelEditButton').on('click', function() {
        const eventId = $('#panelEventId').val();
        closeDetailsPanel();
        
        const fcEvent = calendar.getEventById(eventId);
        if (!fcEvent) return;

        const originalEventData = fcEvent.extendedProps;
        const eventDate = fcEvent.startStr.split('T')[0];

        const newName = prompt('Digite o novo nome para o evento:', originalEventData.nome);

        if (newName && newName.trim() !== '') {
            const updatedEvent = {
                ...originalEventData,
                nome: newName.trim(),
                data: eventDate
            };

            $.ajax({
                url: `${API_URL}/${eventId}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(updatedEvent)
            })
            .done(function() {
                calendar.refetchEvents();
            })
            .fail(function() {
                alert('Erro ao atualizar o evento.');
            });
        }
    });

    // LÓGICA DE EXCLUSÃO (Botão no Painel)
    $('#panelDeleteButton').on('click', function() {
        const eventId = $('#panelEventId').val();
        closeDetailsPanel();

        const fcEvent = calendar.getEventById(eventId);
        if (!fcEvent) return;
        const originalEventData = fcEvent.extendedProps;

        if (!confirm(`Tem certeza que deseja deletar o evento: ${originalEventData.nome}?`)) {
            return;
        }
        
        $.ajax({
            url: `${API_URL}/${eventId}`,
            type: 'DELETE'
        })
        .done(function() {
            calendar.refetchEvents();
        })
        .fail(function() {
            alert('Erro ao deletar o evento.');
        });
    });


    // CREATE (Adicionar Evento)
    $('form').on('submit', function(e) {

        e.preventDefault();
        const $form = $(this);

        const eventName = $('#eventName').val();
        const eventDate = $('#eventDate').val();
        
        const eventDescription = $('#eventDescription').val() || "Sem descrição.";
        const eventType = $('#eventType').val();


        if (!eventName || !eventDate || eventType === 'indefinido') {
            alert('Por favor, preencha o Nome, a Data e selecione um Tipo de Evento.');
            return;
        }

        const newEvent = {
            usuarioID: 2, 
            nome: eventName,
            descricao: eventDescription, 
            tipo: eventType, 
            data: eventDate 
        };

        $.ajax({
            url: API_URL,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newEvent) 
        })
        .done(function() {
            calendar.refetchEvents(); 
            $form[0].reset();
        })
        .fail(function() {
            alert('Erro ao salvar o evento.');
        });
    });


    // CARGA INICIAL E LÓGICA DE NAVEGAÇÃO RÁPIDA
    
    initializeCalendar(); 

    // Ouve a mudança no campo de data oculto.
    $('#gotoDate').on('change', function() {
        const selectedDate = $(this).val();
        
        if (selectedDate) {
            calendar.gotoDate(selectedDate);
        }
        
        $(this).val(''); 
    });
    
});