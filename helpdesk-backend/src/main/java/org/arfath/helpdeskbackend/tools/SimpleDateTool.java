package org.arfath.helpdeskbackend.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Component
public class SimpleDateTool {

    @Tool(description = "get the current date and time in the user zone")
    public OffsetDateTime getCurrentDateAndTime(){
        System.out.println(" date tool called");
        ZoneId zone = LocaleContextHolder.getTimeZone().toZoneId();
        return OffsetDateTime.now(zone);
    }
}
