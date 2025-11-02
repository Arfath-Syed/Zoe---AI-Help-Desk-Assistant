package org.arfath.helpdeskbackend.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import lombok.Setter;
import org.arfath.helpdeskbackend.tools.SimpleDateTool;
import org.arfath.helpdeskbackend.tools.TicketDatabaseTool;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
@Getter
@Setter
public class AiService {

    private final ChatClient chatClient;

    private final TicketDatabaseTool ticketDatabaseTool;

    private  final SimpleDateTool simpleDateTool;


    @Value("classpath:/Helpdesk-System.st")
    private Resource systemPromptResource;

    public String getResponseFromAssistant(String query, String conversationId) {

        //basic call to llm
        return this.chatClient
                .prompt()
                .advisors(advisorSpec -> advisorSpec.param(ChatMemory.CONVERSATION_ID, conversationId))
                .tools(ticketDatabaseTool, simpleDateTool)
                .system(systemPromptResource)
                .user(query)
                .call()
                .content();


    }

    public Flux<String> streamResponseFromAssistant(String query, String conversationId) {


        return this.chatClient
                .prompt()
                .advisors(advisorSpec -> advisorSpec.param(ChatMemory.CONVERSATION_ID, conversationId))
                .tools(ticketDatabaseTool)
                .system(systemPromptResource)
                .user(query)
                .stream().content();

    }
}
