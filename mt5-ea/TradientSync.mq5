//+------------------------------------------------------------------+
//|                                                TradientSync.mq5  |
//|                                  Copyright 2024, Tradient Global |
//|                                       https://www.tradient.com   |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Tradient Global"
#property link      "https://www.tradient.com"
#property version   "1.00"
#property strict

//--- input parameters
input string   InpToken = "";             // Your Unique Webhook Token
input string   InpUrl   = "http://localhost:5000/api/webhooks/mt5"; // Webhook URL
input bool     InpDebug = true;           // Enable Debug Logs

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(InpToken == "") {
      Print("TRADIENT ERROR: Webhook Token is missing! Please get it from the Link MT5 page.");
      return(INIT_FAILED);
   }
   
   Print("TRADIENT: Sync EA Started. Token: ", StringSubstr(InpToken, 0, 8), "...");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Trade Transaction function                                       |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
   // We only care about deals being added to history (actual trade execution)
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      ulong deal_ticket = trans.deal;
      if(HistoryDealSelect(deal_ticket))
      {
         long entry_type = HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
         
         // We only sync CLOSING deals (where result/profit is realized)
         if(entry_type == DEAL_ENTRY_OUT || entry_type == DEAL_ENTRY_INOUT)
         {
            SyncDeal(deal_ticket);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Sync Deal to Webhook                                             |
//+------------------------------------------------------------------+
void SyncDeal(ulong ticket)
{
   string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
   double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT) + HistoryDealGetDouble(ticket, DEAL_COMMISSION) + HistoryDealGetDouble(ticket, DEAL_SWAP);
   long type = HistoryDealGetInteger(ticket, DEAL_TYPE); // DEAL_TYPE_BUY or DEAL_TYPE_SELL
   
   // Heuristic for direction: if it's an 'OUT' deal for a BUY position, the original trade was a BUY.
   // But easier to just check the profit/loss and basic metadata.
   string direction = (type == DEAL_TYPE_SELL) ? "BUY" : "SELL"; // MT5: Closing a BUY requires a SELL deal
   
   double exit_price = HistoryDealGetDouble(ticket, DEAL_PRICE);
   datetime time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
   string date_str = TimeToString(time, TIME_DATE|TIME_MINUTES);
   
   // Find the opening deal to get the entry price
   HistorySelect(time - 86400, time); // Look back 24h
   double entry_price = 0;
   long position_id = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
   
   for(int i=HistoryDealsTotal()-1; i>=0; i--) {
      ulong t = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(t, DEAL_POSITION_ID) == position_id && 
         HistoryDealGetInteger(t, DEAL_ENTRY) == DEAL_ENTRY_IN) {
         entry_price = HistoryDealGetDouble(t, DEAL_PRICE);
         // Overwrite direction with the actual entry deal type
         long entry_deal_type = HistoryDealGetInteger(t, DEAL_TYPE);
         direction = (entry_deal_type == DEAL_TYPE_BUY) ? "BUY" : "SELL";
         break;
      }
   }

   // Prepare JSON
   string json = StringFormat(
      "{\"token\":\"%s\",\"trade\":{\"date\":\"%s\",\"pair\":\"%s\",\"direction\":\"%s\",\"entry\":%f,\"exit\":%f,\"positionSize\":%f,\"result\":%f,\"rr\":0,\"notes\":\"Synced via MT5 EA\"}}",
      InpToken, date_str, symbol, direction, entry_price, exit_price, volume, profit
   );

   SendWebhook(json);
}

//+------------------------------------------------------------------+
//| Send Webhook via WebRequest                                     |
//+------------------------------------------------------------------+
void SendWebhook(string body)
{
   char post[], result[];
   string headers = "Content-Type: application/json\r\n";
   StringToCharArray(body, post);
   
   int res = WebRequest("POST", InpUrl, headers, 1000, post, result);
   
   if(res == -1) {
      Print("TRADIENT ERROR: WebRequest failed. Error code: ", GetLastError());
      if(GetLastError() == 4060) {
         Print("TRADIENT TIP: Go to Tools > Options > Expert Advisors and add '", InpUrl, "' to the allowed URLs.");
      }
   } else {
      if(InpDebug) Print("TRADIENT: Trade synced. Server response: ", CharArrayToString(result));
   }
}
//+------------------------------------------------------------------+
